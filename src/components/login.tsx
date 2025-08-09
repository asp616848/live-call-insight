import React from 'react';
import { motion } from 'framer-motion';
import { GoogleLoginButton } from './GoogleLoginButton';

interface LoginProps {
  collapsed?: boolean;
}

export const Login: React.FC<LoginProps> = ({ collapsed = false }) => {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GoogleLoginButton collapsed={collapsed} />
    </motion.div>
  );
};

export default Login;
