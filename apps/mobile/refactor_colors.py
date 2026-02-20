import os
import re

directories = ["app", "components"]
files_to_modify = []

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                files_to_modify.append(os.path.join(root, file))

for filepath in files_to_modify:
    with open(filepath, "r") as f:
        content = f.read()

    if "COLORS" not in content:
        continue

    # Skip files that already use useThemeColor
    if "useThemeColor" in content:
        continue

    print(f"Refactoring {filepath}")

    # 1. Update imports
    # Handle imports like: import { COLORS } from '@/constants/colors';
    # Or: import { COLORS, SHADOWS } from '@/constants/colors';
    has_shadows = "SHADOWS" in content

    if has_shadows:
        content = re.sub(
            r"import\s*\{\s*COLORS\s*,\s*SHADOWS\s*\}\s*from\s*['\"]@/constants/colors['\"];?",
            "import { SHADOWS } from '@/constants/colors';\nimport { useThemeColor } from '@/hooks/useThemeColor';",
            content,
        )
        content = re.sub(
            r"import\s*\{\s*SHADOWS\s*,\s*COLORS\s*\}\s*from\s*['\"]@/constants/colors['\"];?",
            "import { SHADOWS } from '@/constants/colors';\nimport { useThemeColor } from '@/hooks/useThemeColor';",
            content,
        )
    else:
        content = re.sub(
            r"import\s*\{\s*COLORS\s*\}\s*from\s*['\"]@/constants/colors['\"];?",
            "import { useThemeColor } from '@/hooks/useThemeColor';",
            content,
        )

    # 2. Refactor StyleSheet.create
    if "const styles = StyleSheet.create({" in content:
        content = content.replace(
            "const styles = StyleSheet.create({",
            "const createStyles = (colors: any) => StyleSheet.create({",
        )

    # Replace COLORS. with colors.
    content = content.replace("COLORS.", "colors.")

    # 3. Inject useThemeColor and styles creation into components
    # Find the main exported component
    # Regex looks for: export default function Name(
    # or: export function Name(

    # We will find function definitions and insert the hooks inside.
    # We can match: export function Name(...) {
    # or export default function Name(...) {

    def repl(match):
        func_sig = match.group(0)
        # Check if the function body already has createStyles
        insert = "\n  const colors = useThemeColor();\n"
        if "createStyles" in content:
            insert += "  const styles = createStyles(colors);\n"
        return func_sig + insert

    # Match the opening brace of function components
    # e.g., export default function App() {
    # e.g., export function Button({ ... }: Props) {
    content = re.sub(
        r"(export\s+(?:default\s+)?function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*(?::\s*[A-Za-z0-9_<>]+)?\s*\{)",
        repl,
        content,
    )

    # Also handle arrow functions: export const Button = ({}: Props) => {
    # Let's just be careful here. Let's do a simple manual check if arrow functions are used.
    content = re.sub(
        r"(export\s+const\s+[A-Za-z0-9_]+\s*=\s*(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[A-Za-z0-9_<>]+)?\s*=>\s*\{)",
        repl,
        content,
    )

    with open(filepath, "w") as f:
        f.write(content)

    print(f"Done {filepath}")
