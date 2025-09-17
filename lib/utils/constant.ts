export const APP_CONFIG = {
  APP_NAME: 'SocialConnect',
  MAX_POST_LENGTH: 280,
  MAX_COMMENT_LENGTH: 200,
  MAX_BIO_LENGTH: 160,
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  POSTS_PER_PAGE: 20,
  COMMENTS_PER_PAGE: 10,
  USERS_PER_PAGE: 20,
  NOTIFICATIONS_PER_PAGE: 20,
} as const;

export const POST_CATEGORIES = {
  GENERAL: 'general',
  ANNOUNCEMENT: 'announcement',
  QUESTION: 'question',
} as const;

export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
} as const;

// lib/utils/helpers.ts
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const generateUsername = (firstName: string, lastName: string): string => {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  const random = Math.floor(Math.random() * 1000);
  return `${base}${random}`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};