import { registerAs } from '@nestjs/config';

export default registerAs('github', () => ({
  token: process.env.GITHUB_TOKEN,
  apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
  syncEnabled: process.env.GITHUB_SYNC_ENABLED || 'false',
})); 