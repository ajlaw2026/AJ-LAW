import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Button, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBalanceScale, faUserTie, faLock, faShieldAlt 
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

// --- Animation Variants ---
const letterContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const letterItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const Login = () => {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [animationKey, setAnimationKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 3000); // Repeat every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Default Credentials: admin / 123
    if (loginData.username === "admin" && loginData.password === "123") {
      navigate('/dashboard');
    } else {
      alert("Invalid Credentials. (Hint: admin / 123)");
    }
  };

  return (
    <div className="login-screen">
      <style>{`
        html, body {
          width: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        * {
          box-sizing: border-box;
        }
        .login-screen {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          overflow-y: auto;
          position: relative;
        }

        /* Decorative Background Elements for Login */
        .login-screen::before {
          content: "⚖";
          position: fixed;
          font-size: 350px;
          opacity: 0.06;
          top: -80px;
          left: -100px;
          color: #fbbf24;
          z-index: 0;
          transform: rotate(-45deg);
          pointer-events: none;
        }

        .login-screen::after {
          content: "";
          position: fixed;
          bottom: -150px;
          right: -100px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%);
          z-index: 0;
          pointer-events: none;
          border-radius: 50%;
        }

        .glass-login-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 30px;
          width: 100%;
          max-width: 100%;
          padding: 50px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          position: relative;
          z-index: 1;
        }
        .login-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .desktop-panel {
          display: none;
        }
        .form-panel {
          width: 100%;
        }
        @media (min-width: 1200px) {
          .glass-login-card {
            max-width: 900px;
            border-radius: 20px;
            padding: 50px 40px;
          }
          .login-grid {
            flex-direction: row;
          }
          .desktop-panel {
            display: block;
            width: 40%;
            background: rgba(255,255,255,0.08);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
          }
          .desktop-panel .fa-icon {
            font-size: 5rem;
            color: #fbbf24;
            margin-bottom: 20px;
          }
          .desktop-panel h2 {
            color: #fff;
            font-family: 'Merriweather', 'Georgia', serif;
            font-size: 2.1rem;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .desktop-panel p {
            color: rgba(255,255,255,0.87);
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 1rem;
            line-height: 1.5;
            letter-spacing: 0.4px;
            margin-bottom: 10px;
          }
          .form-panel {
            width: 60%;
          }
        }
        .gold-text {
          color: #fbbf24;
          font-weight: 800;
          letter-spacing: 4px;
          font-size: 2.2rem;
          text-align: center;
          margin-bottom: 10px;
        }
        .law-icon-bg {
          font-size: 6rem;
          color: rgba(251, 191, 36, 0.05);
          position: absolute;
          top: -10px;
          right: -10px;
          transform: rotate(-15deg);
        }
        .input-dark {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 14px !important;
          padding: 14px !important;
          transition: 0.3s;
        }
        .input-dark::placeholder {
          color: rgba(255, 255, 255, 0.9) !important;
          opacity: 1 !important;
        }
        .input-dark:focus {
          border-color: #fbbf24 !important;
          box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1) !important;
        }
        .btn-gold {
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
          border: none;
          border-radius: 14px;
          padding: 16px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: 0.3s;
          margin-top: 10px;
        }
        .btn-gold:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(217, 119, 6, 0.4);
        }
        .sub-text {
          color: rgba(255,255,255,0.5);
          font-size: 0.75rem;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 40px;
        }
        .login-logo {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(251, 191, 36, 0.7);
          box-shadow: 0 0 24px rgba(251, 191, 36, 0.25);
          display: block;
          margin: 0 auto 16px;
        }
        .login-logo-sm {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(251, 191, 36, 0.6);
          box-shadow: 0 0 16px rgba(251, 191, 36, 0.2);
          display: block;
          margin: 0 auto 10px;
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-login-card position-relative overflow-hidden"
      >
        <div className="login-grid">
          <div className="desktop-panel">
          <img src="/ajlogo.jpeg" alt="AJ Law Logo" className="login-logo" />
            <h2>AJ LAW FIRM</h2>
            <p>Secure civil & land records management.</p>
            <p>Fast case tracking, document verification, and dashboard access.</p>
          </div>
          <div className="form-panel">
            <div className="law-icon-bg"><FontAwesomeIcon icon={faBalanceScale} /></div>
            
            <img src="/ajlogo.jpeg" alt="AJ Law Logo" className="login-logo-sm" />

            {/* Animated Title: Letters coming one by one */}
            <motion.div 
          key={animationKey}
          variants={letterContainer} 
          initial="hidden" 
          animate="show" 
          className="gold-text"
        >
          {"AJ LAW FIRM".split("").map((char, index) => (
            <motion.span key={index} variants={letterItem} style={{ display: 'inline-block' }}>
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>

        <p className="sub-text">Civil & Land Records Management</p>

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <InputGroup>
              <InputGroup.Text className="bg-transparent border-0 pe-0 text-white-50">
                <FontAwesomeIcon icon={faUserTie}/>
              </InputGroup.Text>
              <Form.Control 
                className="input-dark" 
                placeholder="Username" 
                autoComplete="off"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-4">
            <InputGroup>
              <InputGroup.Text className="bg-transparent border-0 pe-0 text-white-50">
                <FontAwesomeIcon icon={faLock}/>
              </InputGroup.Text>
              <Form.Control 
                type="password" 
                className="input-dark" 
                placeholder="Password" 
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              />
            </InputGroup>
          </Form.Group>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" className="btn-gold w-100">
              SIGN IN <FontAwesomeIcon icon={faShieldAlt} className="ms-2"/>
            </Button>
          </motion.div>
        </Form>
        
        <div className="text-center mt-4">
          <small style={{color: 'rgba(255,255,255,0.3)'}}>Authorized Personnel Only</small>
        </div>
      </div>
    </div>
  </motion.div>
</div>
  );
};

export default Login;