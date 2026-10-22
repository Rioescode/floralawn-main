'use client';

import { Component } from 'react';

// Keeps a broken widget (like the bottom bar or the yard chat) from blanking the whole site.
export default class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('SafeBoundary caught an error:', error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}