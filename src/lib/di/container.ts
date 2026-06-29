import { createDatabase, type Database } from './database';

export interface Container {
  db: Database;
  getTradesService(): import('../services/trades.service').TradesService;
  getUsersService(): import('../services/users.service').UsersService;
  getRolesService(): import('../services/roles.service').RolesService;
  getUserProfileService(): import('../services/user-profile.service').UserProfileService;
  getTradeReviewService(): import('../services/trade-review.service').TradeReviewService;
  getPortfolioService(): import('../services/portfolio.service').PortfolioService;
  getFavoriteService(): import('../services/favorites.service').FavoriteService;
  getContactTrackingService(): import('../services/contact-tracking.service').ContactTrackingService;
  getEventTrackingService(): import('../services/event-tracking.service').EventTrackingService;
  getUserViewsService(): import('../services/user-views.service').UserViewsService;
  getExpenseService(): import('../services/expense.service').ExpenseService;
  getAppSettingsService(): import('../services/app-settings.service').AppSettingsService;
  getAuditLogService(): import('../services/audit-log.service').AuditLogService;
  getAnalyticsService(): import('../services/analytics.service').AnalyticsService;
  getAdminUserService(): import('../services/admin-user.service').AdminUserService;
  getAdminTradeService(): import('../services/admin-trade.service').AdminTradeService;
  getProviderProfileService(): import('../services/provider-profile.service').ProviderProfileService;
  getVerificationDocumentService(): import('../services/verification-document.service').VerificationDocumentService;
}

let containerInstance: Container | null = null;

export function createContainer(_context?: unknown): Container {
  const db = createDatabase();

  const container: Container = {
    db,

    getTradesService() {
      const { TradesService } = require('../services/trades.service');
      return new TradesService(db);
    },

    getUsersService() {
      const { UsersService } = require('../services/users.service');
      return new UsersService(db);
    },

    getRolesService() {
      const { RolesService } = require('../services/roles.service');
      return new RolesService(db);
    },

    getUserProfileService() {
      const { UserProfileService } = require('../services/user-profile.service');
      return new UserProfileService(db);
    },

    getTradeReviewService() {
      const { TradeReviewService } = require('../services/trade-review.service');
      return new TradeReviewService(db);
    },

    getPortfolioService() {
      const { PortfolioService } = require('../services/portfolio.service');
      return new PortfolioService(db);
    },

    getFavoriteService() {
      const { FavoriteService } = require('../services/favorites.service');
      return new FavoriteService(db);
    },

    getContactTrackingService() {
      const { ContactTrackingService } = require('../services/contact-tracking.service');
      return new ContactTrackingService(db);
    },

    getEventTrackingService() {
      const { EventTrackingService } = require('../services/event-tracking.service');
      return new EventTrackingService(db);
    },

    getUserViewsService() {
      const { UserViewsService } = require('../services/user-views.service');
      return new UserViewsService(db);
    },

    getExpenseService() {
      const { ExpenseService } = require('../services/expense.service');
      return new ExpenseService(db);
    },

    getAppSettingsService() {
      const { AppSettingsService } = require('../services/app-settings.service');
      return new AppSettingsService(db);
    },

    getAuditLogService() {
      const { AuditLogService } = require('../services/audit-log.service');
      return new AuditLogService(db);
    },

    getAnalyticsService() {
      const { AnalyticsService } = require('../services/analytics.service');
      return new AnalyticsService(db);
    },

    getAdminUserService() {
      const { AdminUserService } = require('../services/admin-user.service');
      return new AdminUserService(db);
    },

    getAdminTradeService() {
      const { AdminTradeService } = require('../services/admin-trade.service');
      return new AdminTradeService(db);
    },

    getProviderProfileService() {
      const { ProviderProfileService } = require('../services/provider-profile.service');
      return new ProviderProfileService(db);
    },

    getVerificationDocumentService() {
      const { VerificationDocumentService } = require('../services/verification-document.service');
      return new VerificationDocumentService(db);
    },
  };

  return container;
}

export function getContainer(): Container {
  if (!containerInstance) {
    containerInstance = createContainer();
  }
  return containerInstance;
}

export function resetContainer(): void {
  containerInstance = null;
}
