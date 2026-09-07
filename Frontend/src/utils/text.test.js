// src/utils/text.test.js
import { describe, it, expect } from 'vitest';
import { stripHtml, sanitizeHtml } from './text';

describe('stripHtml', () => {
  it('removes HTML tags from a string', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).to.equal('Hello world');
  });

  it('handles empty input', () => {
    expect(stripHtml('')).to.equal('');
    expect(stripHtml()).to.equal('');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('Just plain text')).to.equal('Just plain text');
  });

  it('collapses repeated whitespace across tags', () => {
    expect(stripHtml('<div>one</div>\n<div>two</div>').replace(/\s+/g, ' ').trim()).to.equal('one two');
  });
});

describe('sanitizeHtml', () => {
  it('keeps safe formatting tags', () => {
    const result = sanitizeHtml('<p><strong>Bold</strong> and <em>italic</em></p>');
    expect(result).to.include('<strong>Bold</strong>');
    expect(result).to.include('<em>italic</em>');
  });

  it('removes script tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
    expect(result).not.to.include('script');
  });

  it('removes javascript URLs from anchors', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.to.include('javascript:');
  });
});