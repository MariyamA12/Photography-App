// src/utils/styles.js

import { StyleSheet } from 'react-native';
import Colors from './colors';   // <-- default import

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 25,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.secondary,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 45,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: Colors.white,
    color: Colors.secondary,
  },
  button: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  linkText: {
    color: Colors.primary,
    fontSize: 12,
  },
});
