import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import logoIcon from '../../asset/favicon.png'

const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="relative flex flex-col items-center justify-center">
        {/* Animated Background Circles */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-32 w-32 rounded-full bg-[#00bc7d]/20 blur-xl"
        />

        {/* Main Logo Container */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Rotating Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 rounded-full border-2 border-dashed border-[#00bc7d]/30"
            />

            {/* Logo Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff] shadow-lg shadow-[#00bc7d]/20">
              <img src={logoIcon} alt="GAMA" className="h-20 w-20 object-contain" />
            </div>
          </motion.div>

          {/* Text */}
          <div className="flex flex-col items-center gap-1">
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold tracking-tight text-[#00bc7d]"
            >
              GAMA
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
            >
              Loading
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
