export function validateFlutterwaveKeys() {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const env = process.env.NODE_ENV;

  if (!publicKey || !secretKey) {
    console.error('❌ Flutterwave keys are missing!');
    return;
  }

  const isTestKey = publicKey.includes('_TEST') || secretKey.includes('_TEST');
  const isProduction = env === 'production';

  if (isProduction && isTestKey) {
    console.warn('⚠️ Test keys are being used in production!');
  }

  if (!isProduction && !isTestKey) {
    console.warn('⚠️ Live keys are being used in development!');
  }
}
