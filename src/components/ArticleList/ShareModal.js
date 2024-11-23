import React, { useState } from "react";
import { 
  FaFacebookF, 
  FaTwitter, 
  FaEnvelope, 
  FaCopy, 
  FaTimes, 
  FaShareAlt,
  FaLinkedinIn,
  FaRedditAlien,
  FaWhatsapp,
  FaTelegram,
  FaPinterestP,
  FaLink
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/ShareModal.css";

function ShareModal({ show, onClose, shareLink, generateShareUrl }) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeIcon, setActiveIcon] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getShareUrl = (platform, url, title = "Check out this article!") => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
    };

    return urls[platform] || url;
  };

  const socialPlatforms = [
    {
      name: 'facebook',
      icon: FaFacebookF,
      color: 'text-blue-600',
      gradient: 'from-blue-50 to-blue-100',
      shadow: 'shadow-blue-100',
      shadowRgb: '59, 130, 246',
      ariaLabel: 'Share on Facebook'
    },
    {
      name: 'twitter',
      icon: FaTwitter,
      color: 'text-blue-500',
      gradient: 'from-blue-50 to-blue-100',
      shadow: 'shadow-blue-100',
      shadowRgb: '59, 130, 246',
      ariaLabel: 'Share on Twitter'
    },
    {
      name: 'linkedin',
      icon: FaLinkedinIn,
      color: 'text-blue-700',
      gradient: 'from-blue-50 to-blue-100',
      shadow: 'shadow-blue-100',
      shadowRgb: '59, 130, 246',
      ariaLabel: 'Share on LinkedIn'
    },
    {
      name: 'reddit',
      icon: FaRedditAlien,
      color: 'text-orange-600',
      gradient: 'from-orange-50 to-orange-100',
      shadow: 'shadow-orange-100',
      shadowRgb: '251, 146, 60',
      ariaLabel: 'Share on Reddit'
    },
    {
      name: 'whatsapp',
      icon: FaWhatsapp,
      color: 'text-green-600',
      gradient: 'from-green-50 to-green-100',
      shadow: 'shadow-green-100',
      shadowRgb: '34, 197, 94',
      ariaLabel: 'Share on WhatsApp'
    },
    {
      name: 'telegram',
      icon: FaTelegram,
      color: 'text-sky-500',
      gradient: 'from-sky-50 to-sky-100',
      shadow: 'shadow-sky-100',
      shadowRgb: '14, 165, 233',
      ariaLabel: 'Share on Telegram'
    },
    {
      name: 'pinterest',
      icon: FaPinterestP,
      color: 'text-red-600',
      gradient: 'from-red-50 to-red-100',
      shadow: 'shadow-red-100',
      shadowRgb: '239, 68, 68',
      ariaLabel: 'Share on Pinterest'
    },
    {
      name: 'email',
      icon: FaEnvelope,
      color: 'text-gray-600',
      gradient: 'from-gray-50 to-gray-100',
      shadow: 'shadow-gray-100',
      shadowRgb: '156, 163, 175',
      ariaLabel: 'Share via Email'
    }
  ];

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        duration: 0.5,
        bounce: 0.5,
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      rotate: 10,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const iconVariants = {
    hover: (custom) => ({
      scale: 1.2,
      y: -5,
      rotate: custom ? [-10, 10, -10, 0] : 0,
      transition: {
        rotate: {
          repeat: custom ? Infinity : 0,
          duration: 1
        }
      }
    }),
    tap: { scale: 0.9 }
  };

  const shareIconVariants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: 360,
      transition: {
        duration: 20,
        ease: "linear",
        repeat: Infinity
      }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
            }}
          >
            {/* Background decoration */}
            <motion.div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl"
              style={{
                background: "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))"
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close share modal"
            >
              <FaTimes size={20} />
            </motion.button>

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center mb-8 relative"
            >
              <motion.div
                variants={shareIconVariants}
                initial="initial"
                animate="animate"
                className="absolute -left-2 top-1 text-blue-500/20"
              >
                <FaShareAlt size={24} />
              </motion.div>
              <h2 className="text-2xl font-bold text-center text-gray-800">
                Share this Article
              </h2>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <div className="group flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
                <div className="flex-1 flex items-center space-x-2 px-2">
                  <FaLink className="text-gray-400" />
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-transparent text-gray-700 outline-none"
                    aria-label="Share link"
                  />
                </div>
                <motion.button
                  variants={iconVariants}
                  whileHover="hover"
                  whileTap="tap"
                  custom={copySuccess}
                  onClick={handleCopy}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all flex items-center space-x-2 shadow-md hover:shadow-xl"
                  aria-label="Copy share link"
                >
                  <FaCopy className={copySuccess ? "text-green-200" : ""} />
                  <span>{copySuccess ? "Copied!" : "Copy"}</span>
                </motion.button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-gray-700 mb-6">
                Share on Social Media
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {socialPlatforms.map((platform) => (
                  <motion.a
                    key={platform.name}
                    href={getShareUrl(platform.name, shareLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={iconVariants}
                    whileHover="hover"
                    whileTap="tap"
                    custom={activeIcon === platform.name}
                    onHoverStart={() => setActiveIcon(platform.name)}
                    onHoverEnd={() => setActiveIcon(null)}
                    className={`p-4 rounded-xl bg-gradient-to-br ${platform.gradient} ${platform.color} hover:shadow-lg ${platform.shadow} transition-all flex items-center justify-center`}
                    style={{
                      boxShadow: `0 2px 10px -2px rgba(${platform.shadowRgb}, 0.2)`
                    }}
                    aria-label={platform.ariaLabel}
                  >
                    <platform.icon size={24} />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ShareModal;
