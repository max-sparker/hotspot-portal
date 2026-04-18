import { createApp } from './app';
import { config } from './config/env';
import { db } from './config/database';

const app = createApp();

const PORT = config.PORT;

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');

  try {
    await db.close();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 HotSpot Portal API Server');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 API URL: ${config.API_BASE_URL}`);
  console.log('');
});
