// LOC_CATEGORY: interface
import { setupServer } from 'msw/node';
import { authHandlers } from './authHandlers';
import { propertyHandlers } from './propertyHandlers';
import { uploadHandlers } from './uploadHandlers';
import { analyticsHandlers } from './analyticsHandlers';

// This configures a request mocking server with the given request handlers
export const server = setupServer(
  ...authHandlers,
  ...propertyHandlers,
  ...uploadHandlers,
  ...analyticsHandlers
);
