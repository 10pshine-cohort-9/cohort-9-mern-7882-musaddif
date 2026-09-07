import { expect } from 'chai';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateNoteTitle,
  validateNoteContent,
  validateNoteCategory,
} from '../src/utils/validation.js';

describe('Validation utilities', () => {
  describe('validateName', () => {
    it('accepts a valid name', () => {
      expect(validateName('John Doe')).to.be.null;
    });
    it('rejects empty name', () => {
      expect(validateName('')).to.not.be.null;
    });
    it('rejects missing name', () => {
      expect(validateName(undefined)).to.not.be.null;
    });
    it('rejects names longer than 100 chars', () => {
      expect(validateName('x'.repeat(101))).to.not.be.null;
    });
  });

  describe('validateEmail', () => {
    it('accepts a valid email', () => {
      expect(validateEmail('user@example.com')).to.be.null;
    });
    it('rejects an invalid email', () => {
      expect(validateEmail('not-an-email')).to.not.be.null;
    });
    it('rejects missing email', () => {
      expect(validateEmail(undefined)).to.not.be.null;
    });
  });

  describe('validatePassword', () => {
    it('accepts a strong password', () => {
      expect(validatePassword('StrongPass1')).to.be.null;
    });
    it('rejects password shorter than 8 chars', () => {
      expect(validatePassword('Short1')).to.not.be.null;
    });
    it('rejects password without uppercase letter', () => {
      expect(validatePassword('lowercase1')).to.not.be.null;
    });
    it('rejects password without a number', () => {
      expect(validatePassword('LowercaseA')).to.not.be.null;
    });
  });

  describe('validateNoteTitle', () => {
    it('accepts a valid title', () => {
      expect(validateNoteTitle('Grocery list')).to.be.null;
    });
    it('rejects empty title', () => {
      expect(validateNoteTitle(' ')).to.not.be.null;
    });
    it('rejects title over 255 chars', () => {
      expect(validateNoteTitle('x'.repeat(256))).to.not.be.null;
    });
  });

  describe('validateNoteContent', () => {
    it('accepts valid content', () => {
      expect(validateNoteContent('Some content')).to.be.null;
    });
    it('rejects empty content', () => {
      expect(validateNoteContent('')).to.not.be.null;
    });
  });

  describe('validateNoteCategory', () => {
    it('accepts a known category', () => {
      expect(validateNoteCategory('Work')).to.be.null;
    });
    it('rejects an unknown category', () => {
      expect(validateNoteCategory('Unknown')).to.not.be.null;
    });
  });
});