import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POETRY_APP_BUNDLE,
  POETRY_ROLES,
  POETRY_PERMISSIONS,
  POETRY_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS,
  POETRY_SOCKET_EVENTS,
  POEM_STATUSES,
} from '../../constants/poetry';
import { buildExcerpt, estimateReadingTime, slugify } from '../../services/poetryIntegrationService';

describe('poetry constants', () => {
  it('defines poetry app bundle', () => {
    assert.equal(POETRY_APP_BUNDLE, 'com.gulfos.poetry');
  });

  it('defines 6 poetry roles', () => {
    assert.equal(POETRY_ROLES.length, 6);
    assert.ok(POETRY_ROLES.includes('server_poet'));
    assert.ok(POETRY_ROLES.includes('poet'));
    assert.ok(POETRY_ROLES.includes('moderator'));
    assert.ok(POETRY_ROLES.includes('viewer'));
  });

  it('defines poem categories', () => {
    assert.equal(POETRY_CATEGORIES.length, 14);
    assert.ok(POETRY_CATEGORIES.includes('national'));
    assert.ok(POETRY_CATEGORIES.includes('server_story'));
    assert.ok(POETRY_CATEGORIES.includes('roleplay'));
  });

  it('defines granular permissions', () => {
    assert.ok(POETRY_PERMISSIONS.length >= 30);
    assert.ok(POETRY_PERMISSIONS.includes('poems.publish'));
    assert.ok(POETRY_PERMISSIONS.includes('poems.moderate'));
    assert.ok(POETRY_PERMISSIONS.includes('rbac.configure'));
    assert.ok(POETRY_PERMISSIONS.includes('voice.record'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_ROLE_PERMISSIONS.server_poet.length >= POETRY_PERMISSIONS.length - 1);
    assert.ok(DEFAULT_ROLE_PERMISSIONS.viewer.includes('poems.view'));
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.viewer.includes('poems.publish'));
    assert.ok(DEFAULT_ROLE_PERMISSIONS.moderator.includes('poems.approve'));
    assert.ok(DEFAULT_ROLE_PERMISSIONS.poet.includes('poems.create'));
  });

  it('defines poem statuses', () => {
    assert.ok(POEM_STATUSES.includes('draft'));
    assert.ok(POEM_STATUSES.includes('scheduled'));
    assert.ok(POEM_STATUSES.includes('published'));
    assert.ok(POEM_STATUSES.includes('pending_review'));
  });

  it('defines poetry socket events', () => {
    assert.ok(POETRY_SOCKET_EVENTS.length >= 10);
    assert.ok(POETRY_SOCKET_EVENTS.includes('poetry:poem:published'));
    assert.ok(POETRY_SOCKET_EVENTS.includes('poetry:comment:new'));
    assert.ok(POETRY_SOCKET_EVENTS.includes('poetry:like'));
  });
});

describe('poetry integration helpers', () => {
  it('estimates reading time from word count', () => {
    assert.equal(estimateReadingTime('one two three four five'), 1);
    const long = Array(300).fill('word').join(' ');
    assert.ok(estimateReadingTime(long) >= 2);
  });

  it('builds excerpt from content', () => {
    const excerpt = buildExcerpt('This is a **bold** poem about the gulf.');
    assert.ok(excerpt.includes('bold'));
    assert.ok(!excerpt.includes('**'));
  });

  it('slugifies titles', () => {
    assert.equal(slugify('Ode to the Gulf!'), 'ode-to-the-gulf');
  });
});

describe('poetry API routes', () => {
  it('mounts under /api/poetry', () => {
    const routes = [
      '/api/poetry/initialize',
      '/api/poetry/home',
      '/api/poetry/random',
      '/api/poetry/search',
      '/api/poetry/poems',
      '/api/poetry/bookmarks',
      '/api/poetry/favorites',
      '/api/poetry/collections',
      '/api/poetry/events',
      '/api/poetry/competitions',
      '/api/poetry/challenges',
      '/api/poetry/moderation/logs',
      '/api/poetry/rbac',
      '/api/poetry/verified-poets',
    ];
    assert.ok(routes.every((r) => r.startsWith('/api/poetry')));
    assert.equal(routes.length, 14);
  });
});
