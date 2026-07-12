// src/utils/pagination.js

import { PAGINATION } from './constants.js';

/**
 * Parse pagination query parameters.
 *
 * @param {number|string} page
 * @param {number|string} limit
 * @returns {{page:number,limit:number,skip:number}}
 */
export function getPagination(page, limit) {
  let currentPage =
    Number.parseInt(page, 10) ||
    PAGINATION.DEFAULT_PAGE;

  let currentLimit =
    Number.parseInt(limit, 10) ||
    PAGINATION.DEFAULT_LIMIT;

  if (currentPage < 1) {
    currentPage = PAGINATION.DEFAULT_PAGE;
  }

  if (currentLimit < 1) {
    currentLimit = PAGINATION.DEFAULT_LIMIT;
  }

  if (currentLimit > PAGINATION.MAX_LIMIT) {
    currentLimit = PAGINATION.MAX_LIMIT;
  }

  return {
    page: currentPage,
    limit: currentLimit,
    skip: (currentPage - 1) * currentLimit,
  };
}

/**
 * Build pagination metadata.
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @returns {object}
 */
export function buildPagination(
  page,
  limit,
  total
) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,

    hasPreviousPage: page > 1,

    hasNextPage: page < totalPages,
  };
}