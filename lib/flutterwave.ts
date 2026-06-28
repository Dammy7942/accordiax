export function validateFlutterwaveKeys() {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  const env = process.env.NODE_ENV;

  if (!publicKey) {
    console.error('❌ Flutterwave public key is missing!');
    return;
  }

  const isTestKey = publicKey.includes('_TEST');
  const isProduction = env === 'production';

  if (isProduction && isTestKey) {
    console.warn('⚠️ Test keys are being used in production!');
  }

  if (!isProduction && !isTestKey) {
    console.warn('⚠️ Live keys are being used in development!');
  }
}
