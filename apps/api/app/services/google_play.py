"""Google Play billing verification service."""

import os
import json
from typing import Optional, Dict, Any
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings


class GooglePlayService:
    """Service for verifying Google Play in-app purchases."""

    def __init__(self):
        self.service = None
        self._initialize_service()

    def _initialize_service(self):
        """Initialize Google Play Developer API service."""
        if not settings.google_play_service_account_json:
            print("Warning: Google Play service account not configured")
            return

        if not os.path.exists(settings.google_play_service_account_json):
            print(
                f"Warning: Service account file not found: {settings.google_play_service_account_json}"
            )
            return

        try:
            credentials = service_account.Credentials.from_service_account_file(
                settings.google_play_service_account_json,
                scopes=["https://www.googleapis.com/auth/androidpublisher"],
            )

            self.service = build("androidpublisher", "v3", credentials=credentials)
            print("✅ Google Play service initialized")
        except Exception as e:
            print(f"❌ Error initializing Google Play service: {e}")

    def verify_purchase(
        self, package_name: str, product_id: str, purchase_token: str
    ) -> Optional[Dict[str, Any]]:
        """
        Verify a purchase with Google Play.

        Args:
            package_name: Android app package name (e.g., 'com.icalorie.app')
            product_id: Product ID (e.g., 'com.icalorie.tokens.5')
            purchase_token: Purchase token from the purchase

        Returns:
            Purchase data if valid, None if invalid

        Purchase states:
            0 = Purchased
            1 = Canceled
            2 = Pending
        """
        if not self.service:
            raise RuntimeError(
                "Google Play service not initialized. Check service account configuration."
            )

        try:
            result = (
                self.service.purchases()
                .products()
                .get(
                    packageName=package_name, productId=product_id, token=purchase_token
                )
                .execute()
            )

            # Check purchase state
            purchase_state = result.get("purchaseState", -1)

            if purchase_state == 0:  # Purchased
                return {
                    "valid": True,
                    "purchase_state": purchase_state,
                    "purchase_time_millis": result.get("purchaseTimeMillis"),
                    "order_id": result.get("orderId"),
                    "acknowledged": result.get("acknowledgementState", 0) == 1,
                    "consumption_state": result.get("consumptionState", 0),
                }
            else:
                return {
                    "valid": False,
                    "purchase_state": purchase_state,
                    "error": f"Purchase state is {purchase_state} (not purchased)",
                }

        except HttpError as e:
            error_content = json.loads(e.content.decode("utf-8"))
            error_message = error_content.get("error", {}).get("message", str(e))

            return {"valid": False, "error": f"Google Play API error: {error_message}"}
        except Exception as e:
            return {"valid": False, "error": f"Verification error: {str(e)}"}

    def acknowledge_purchase(
        self, package_name: str, product_id: str, purchase_token: str
    ) -> bool:
        """
        Acknowledge a purchase (required by Google Play).

        Returns:
            True if successful, False otherwise
        """
        if not self.service:
            return False

        try:
            self.service.purchases().products().acknowledge(
                packageName=package_name, productId=product_id, token=purchase_token
            ).execute()
            return True
        except Exception as e:
            print(f"Error acknowledging purchase: {e}")
            return False


# Singleton instance
_google_play_service = None


def get_google_play_service() -> GooglePlayService:
    """Get or create GooglePlayService singleton."""
    global _google_play_service
    if _google_play_service is None:
        _google_play_service = GooglePlayService()
    return _google_play_service
