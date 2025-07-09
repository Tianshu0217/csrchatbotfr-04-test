// src/helpers.js

/**
 * 按空行（两个及以上连续换行）拆段，返回非空段落数组
 * @param {string} text
 * @returns {string[]}
 */
export function splitReply(text) {
    return text
      .split(/\n{2,}/g)
      .map(p => p.trim())
      .filter(p => p);
  }
  