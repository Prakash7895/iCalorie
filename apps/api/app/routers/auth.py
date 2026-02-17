from app.services.url_helper import get_s3_url
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.schemas import (
    SignupRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
    TokenBalanceResponse,
    PurchaseTokensRequest,
    TokenUsageResponse,
    TokenPackage,
    PricingInfo,
    AndroidPurchaseRequest,
)
from app.services.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.services.token_service import (
    get_scan_balance,
    add_purchased_scans,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


@router.post("/signup", response_model=AuthResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(request.password)
    new_user = User(
        email=request.email,
        name=request.name,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token
    access_token = create_access_token(data={"sub": str(new_user.id)})

    return AuthResponse(
        token=access_token,
        user=UserResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            profile_picture_url=get_s3_url(new_user.profile_picture_url),
            created_at=new_user.created_at.isoformat(),
            scans_remaining=new_user.scans_remaining,
        ),
    )


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return a token."""
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})

    return AuthResponse(
        token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            profile_picture_url=get_s3_url(user.profile_picture_url),
            created_at=user.created_at.isoformat(),
            scans_remaining=user.scans_remaining,
        ),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to get the current authenticated user."""
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # IMPORTANT: Must return User (SQLAlchemy model) not UserResponse (Pydantic)
    # This allows other endpoints to use db operations like db.commit(), db.refresh()
    return user


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get the current authenticated user."""

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=get_s3_url(current_user.profile_picture_url),
        created_at=current_user.created_at.isoformat(),
        scans_remaining=current_user.scans_remaining,
    )


@router.put("/profile", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user profile."""
    if request.name is not None:
        current_user.name = request.name

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=current_user.profile_picture_url,
        created_at=current_user.created_at.isoformat(),
        scans_remaining=current_user.scans_remaining,
    )


@router.put("/password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change user password."""
    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Update password
    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()

    return {"status": "ok", "message": "Password updated successfully"}


@router.put("/profile-picture", response_model=UserResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload profile picture."""
    from app.services.storage import upload_image
    import uuid

    # Read file content
    content = await file.read()

    # Generate unique key
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    key = f"profiles/{current_user.id}/{uuid.uuid4()}.{file_extension}"

    # Upload to S3 (returns full URL but we only store the key)
    upload_image(key, content, file.content_type or "image/jpeg")

    # Store only the key/path in database
    current_user.profile_picture_url = key
    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=get_s3_url(current_user.profile_picture_url),
        created_at=current_user.created_at.isoformat(),
        scans_remaining=current_user.scans_remaining,
    )


@router.get("/tokens", response_model=TokenBalanceResponse)
def get_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current token balance and reset information."""

    balance_info = get_scan_balance(current_user)
    return TokenBalanceResponse(**balance_info)


@router.post("/tokens/purchase", response_model=UserResponse)
def purchase_tokens(
    request: PurchaseTokensRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Purchase additional AI tokens.

    NOTE: This is a placeholder endpoint. In production, integrate with a payment
    provider (Stripe, PayPal, etc.) before adding tokens.
    """
    # TODO: Add payment integration here
    # For now, this is a placeholder that simply adds tokens
    # In production, you would:
    # 1. Create a payment intent with Stripe/PayPal
    # 2. Verify payment success
    # 3. Then add tokens to user account

    # Placeholder: Add tokens directly (for testing/demo purposes)
    updated_user = add_purchased_scans(current_user, request.amount, db)

    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        profile_picture_url=get_s3_url(updated_user.profile_picture_url),
        created_at=updated_user.created_at.isoformat(),
        scans_remaining=updated_user.scans_remaining,
    )


@router.get("/tokens/usage", response_model=dict)
def get_token_usage(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's token usage history with pagination.

    Returns recent API calls with token consumption and estimated costs.
    """
    from app.models import TokenUsage

    # Get total count
    total = db.query(TokenUsage).filter(TokenUsage.user_id == current_user.id).count()

    # Get paginated results
    usage_records = (
        db.query(TokenUsage)
        .filter(TokenUsage.user_id == current_user.id)
        .order_by(TokenUsage.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Calculate total cost
    total_cost = (
        db.query(TokenUsage)
        .filter(TokenUsage.user_id == current_user.id)
        .with_entities(db.func.sum(TokenUsage.estimated_cost_usd))
        .scalar()
        or 0.0
    )

    total_tokens_used = (
        db.query(TokenUsage)
        .filter(TokenUsage.user_id == current_user.id)
        .with_entities(db.func.sum(TokenUsage.total_tokens))
        .scalar()
        or 0
    )

    return {
        "usage": [
            TokenUsageResponse(
                id=record.id,
                model_name=record.model_name,
                input_tokens=record.input_tokens,
                output_tokens=record.output_tokens,
                total_tokens=record.total_tokens,
                estimated_cost_usd=record.estimated_cost_usd,
                endpoint=record.endpoint,
                created_at=record.created_at.isoformat(),
            )
            for record in usage_records
        ],
        "total_records": total,
        "total_cost_usd": round(total_cost, 4),
        "total_tokens_used": total_tokens_used,
        "limit": limit,
        "offset": offset,
    }


@router.get("/tokens/pricing", response_model=PricingInfo)
def get_token_pricing():
    """
    Get available scan packages and pricing information.
    """
    packages = [
        TokenPackage(
            product_id="com.icalorie.tokens.5",
            scans=5,
            price_usd=0.99,
            savings_percent=0,
        ),
        TokenPackage(
            product_id="com.icalorie.tokens.15",
            scans=15,
            price_usd=2.49,
            savings_percent=17,
        ),
        TokenPackage(
            product_id="com.icalorie.tokens.50",
            scans=50,
            price_usd=4.99,
            savings_percent=50,
        ),
    ]

    return PricingInfo(
        packages=packages,
        price_per_scan=0.10,
    )


@router.post("/tokens/verify-android-purchase", response_model=UserResponse)
def verify_android_purchase(
    request: AndroidPurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verify Android in-app purchase and add tokens to user account.

    1. Validates purchase with Google Play
    2. Checks for duplicate purchases (prevents replay attacks)
    3. Adds tokens to user account
    4. Logs purchase receipt for auditing
    """
    from app.models import PurchaseReceipt
    from app.services.google_play import get_google_play_service
    from app.services.token_service import add_purchased_tokens
    from app.config import settings

    # Use provided package name or default from config
    package_name = request.package_name or settings.google_play_package_name

    if not package_name:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Play package name not configured",
        )

    # Check if receipt already processed (prevent duplicates)
    existing_receipt = (
        db.query(PurchaseReceipt)
        .filter(PurchaseReceipt.receipt_token == request.purchase_token)
        .first()
    )

    if existing_receipt:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This purchase has already been processed",
        )

    # Verify purchase with Google Play
    google_play = get_google_play_service()
    verification_result = google_play.verify_purchase(
        package_name=package_name,
        product_id=request.product_id,
        purchase_token=request.purchase_token,
    )

    if not verification_result or not verification_result.get("valid"):
        error_msg = (
            verification_result.get("error", "Invalid purchase")
            if verification_result
            else "Verification failed"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Purchase verification failed: {error_msg}",
        )

    # Map product IDs to token amounts
    token_packages = {
        "com.icalorie.tokens.5": {"scans": 5, "price": 0.99},
        "com.icalorie.tokens.15": {"scans": 15, "price": 2.49},
        "com.icalorie.tokens.50": {"scans": 50, "price": 4.99},
    }

    package = token_packages.get(request.product_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown product ID: {request.product_id}",
        )

    # Add scans to user account
    scans_to_add = package["scans"]
    updated_user = add_purchased_scans(current_user, scans_to_add, db)

    # Save purchase receipt
    receipt = PurchaseReceipt(
        user_id=current_user.id,
        platform="android",
        product_id=request.product_id,
        receipt_token=request.purchase_token,
        scans_added=scans_to_add,
        price_usd=package["price"],
    )
    db.add(receipt)
    db.commit()

    # Acknowledge purchase with Google Play (required)
    google_play.acknowledge_purchase(
        package_name=package_name,
        product_id=request.product_id,
        purchase_token=request.purchase_token,
    )

    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        profile_picture_url=get_s3_url(updated_user.profile_picture_url),
        created_at=updated_user.created_at.isoformat(),
        scans_remaining=updated_user.scans_remaining,
    )
