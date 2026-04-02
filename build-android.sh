#!/usr/bin/env bash
# ============================================================
# EAS Build Android — jalankan dari laptop/PC lokal
# Syarat: Node.js >=18, pnpm, git, akun Expo
# ============================================================

set -e

PROFILE="${1:-preview}"
VALID_PROFILES="preview production-apk production-aab development"

if ! echo "$VALID_PROFILES" | grep -qw "$PROFILE"; then
  echo "❌  Profile tidak valid: $PROFILE"
  echo "   Pilihan: $VALID_PROFILES"
  exit 1
fi

echo "📦  Build profile: $PROFILE"
echo ""

# 1. Pastikan EAS CLI terinstall
if ! command -v eas &>/dev/null; then
  echo "⬇️  Menginstall EAS CLI..."
  npm install -g eas-cli
fi

# 2. Login EAS (pakai EXPO_TOKEN jika sudah di-set)
if [ -z "$EXPO_TOKEN" ]; then
  echo "🔑  Login ke akun Expo kamu:"
  eas login
else
  echo "✅  Menggunakan EXPO_TOKEN dari environment"
fi

# 3. Install dependencies workspace
echo ""
echo "📥  Install dependencies..."
pnpm install --frozen-lockfile

# 4. Masuk ke folder mobile dan build
echo ""
echo "🚀  Memulai EAS Build ($PROFILE)..."
cd artifacts/mobile
eas build --platform android --profile "$PROFILE" --non-interactive --no-wait

echo ""
echo "✅  Build telah di-queue! Pantau progress di:"
echo "   https://expo.dev/accounts/[username]/projects/mobile/builds"
