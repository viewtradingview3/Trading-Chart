/**
 * Authentication Manager for AlphaVision Pro
 * Handles TradingView-style Glassmorphic Login & Sign-Up Modal,
 * user session state, guest access, and persistent profile storage.
 */

export class AuthManager {
  constructor() {
    this.user = this.loadUser();
    this.onAuthChangeCallback = null;
  }

  loadUser() {
    try {
      const saved = localStorage.getItem('alphavision_user');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null; // Guest by default
  }

  saveUser(user) {
    this.user = user;
    try {
      if (user) {
        localStorage.setItem('alphavision_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('alphavision_user');
      }
    } catch (_) {}

    if (this.onAuthChangeCallback) {
      this.onAuthChangeCallback(this.user);
    }
  }

  login(email, password, remember = true) {
    if (!email || !password) {
      return { success: false, error: 'Email aur Password enter karein!' };
    }

    const name = email.split('@')[0];
    const user = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      role: 'PRO TRADER',
      avatar: name.charAt(0).toUpperCase(),
      joined: new Date().toLocaleDateString(),
    };

    this.saveUser(user);
    return { success: true, user };
  }

  signup(name, email, password) {
    if (!name || !email || !password) {
      return { success: false, error: 'Tamam fields mukammal karein!' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password kam az kam 6 characters ka hona chahiye!' };
    }

    const user = {
      name: name.trim(),
      email: email.trim(),
      role: 'PRO TRADER',
      avatar: name.charAt(0).toUpperCase(),
      joined: new Date().toLocaleDateString(),
    };

    this.saveUser(user);
    return { success: true, user };
  }

  loginWithProvider(providerName) {
    const user = {
      name: `Trader (${providerName})`,
      email: `trader@${providerName.toLowerCase()}.com`,
      role: 'PRO TRADER',
      avatar: providerName.charAt(0),
      joined: new Date().toLocaleDateString(),
    };
    this.saveUser(user);
    return { success: true, user };
  }

  logout() {
    this.saveUser(null);
  }

  isLoggedIn() {
    return this.user !== null;
  }
}
