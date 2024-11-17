import { analytics } from '../firebaseConfig';
import { logEvent } from 'firebase/analytics';

// Article Events
export const logArticleAdd = (articleId, folderId = null) => {
  logEvent(analytics, 'article_add', {
    article_id: articleId,
    folder_id: folderId,
    has_folder: !!folderId
  });
};

export const logArticleView = (articleId) => {
  logEvent(analytics, 'article_view', {
    article_id: articleId
  });
};

export const logArticleDelete = (articleId) => {
  logEvent(analytics, 'article_delete', {
    article_id: articleId
  });
};

// Folder Events
export const logFolderCreate = (folderId, hasParent) => {
  logEvent(analytics, 'folder_create', {
    folder_id: folderId,
    has_parent: hasParent
  });
};

export const logFolderView = (folderId) => {
  logEvent(analytics, 'folder_view', {
    folder_id: folderId
  });
};

export const logFolderDelete = (folderId) => {
  logEvent(analytics, 'folder_delete', {
    folder_id: folderId
  });
};

// Search Events
export const logSearch = (query, resultCount) => {
  logEvent(analytics, 'search', {
    search_term: query,
    result_count: resultCount
  });
};

// User Events
export const logLogin = (method) => {
  logEvent(analytics, 'login', {
    method: method
  });
};

export const logSignup = (method) => {
  logEvent(analytics, 'sign_up', {
    method: method
  });
};

// Error Events
export const logError = (errorCode, errorMessage, context) => {
  logEvent(analytics, 'error', {
    error_code: errorCode,
    error_message: errorMessage,
    context: context
  });
};

// Navigation Events
export const logPageView = (pageName) => {
  logEvent(analytics, 'page_view', {
    page_name: pageName
  });
};

// Feature Usage Events
export const logFeatureUse = (featureName, details = {}) => {
  logEvent(analytics, 'feature_use', {
    feature_name: featureName,
    ...details
  });
};
