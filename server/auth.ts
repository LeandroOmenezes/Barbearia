import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local"; // <--- ADICIONE ESTA LINHA AQUI
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto"; // Caso use para criptografia de senha
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";


const MemoryStore = createMemoryStore(session);



declare global {
  namespace Express {
    // Estendendo a interface User do Express para incluir nossos campos personalizados
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) return false;
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    if (hashedBuf.length !== suppliedBuf.length) return false;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch {
    return false;
  }
}

// Função para enviar e-mail de recuperação de senha
async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}`
    : 'http://localhost:5000';
  const resetLink = `${baseUrl}/reset-password/${resetToken}`;
  
  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin-bottom: 10px;">Salão de Beleza Premium</h1>
        <h2 style="color: #666; font-weight: normal;">Recuperação de Senha</h2>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
          Olá,
        </p>
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
          Você solicitou a recuperação de senha para sua conta no <strong>Salão de Beleza Premium</strong>.
        </p>
        <p style="color: #555; font-size: 16px; margin-bottom: 30px;">
          Clique no botão abaixo para criar uma nova senha:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="
            background-color: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
          ">🔒 Redefinir Minha Senha</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          ⚠️ <strong>Importante:</strong> Este link expira em 1 hora por segurança.
        </p>
        <p style="color: #666; font-size: 14px;">
          Se você não solicitou esta recuperação, pode ignorar este email com segurança.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; margin-bottom: 5px;">
          <strong>Salão de Beleza Premium</strong>
        </p>
        <p style="color: #999; font-size: 12px;">
          Este é um email automático, não responda a esta mensagem.
        </p>
      </div>
    </div>
  `;
  
  // Tentar SendGrid primeiro (produção)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const mailService = new MailService();
      mailService.setApiKey(process.env.SENDGRID_API_KEY);
      
      await mailService.send({
        to: email,
        from: 'lleandro.m32@gmail.com',
        subject: '🔒 Recuperação de Senha - Salão de Beleza Premium',
        html: emailHTML
      });
      console.log(`[EMAIL] ✅ Email de recuperação enviado via SendGrid.`);
      return true;
    } catch (error: any) {
      const errBody = error?.response?.body || error?.message || error;
      console.error(`[EMAIL] ❌ Falha no SendGrid:`, JSON.stringify(errBody, null, 2));
      console.error(`[EMAIL] Dica: Verifique o email remetente em https://app.sendgrid.com/settings/sender_auth`);
    }
  }
  
  // Fallback para Gmail/Nodemailer
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Salão de Beleza Premium" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Recuperação de Senha - Salão de Beleza Premium',
        html: emailHTML
      });
      
      console.log(`[EMAIL] ✅ Email de recuperação enviado via Gmail.`);
      return true;
    } catch (error: any) {
      console.error(`[EMAIL] ❌ Falha no Gmail/Nodemailer:`, error?.message);
    }
  }
  
  // Fallback final: exibe o link no console do servidor para que o administrador possa usar
  console.log(`\n[EMAIL] ⚠️  NENHUM SERVIÇO DE EMAIL FUNCIONOU`);
  console.log(`[EMAIL] 🔗 Link de recuperação gerado (expira em 1 hora).`);

  // Retorna false para indicar que o email não foi enviado mas o link foi gerado
  return false;
}

// Função para gerar um token de recuperação de senha
async function generatePasswordResetToken(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expira em 1 hora
  
  await storage.createPasswordResetToken({ token, userId, expiresAt });
  return token;
}

// Função para verificar um token de recuperação de senha
async function verifyPasswordResetToken(token: string): Promise<number | null> {
  const tokenData = await storage.getPasswordResetToken(token);
  
  if (!tokenData) {
    return null;
  }
  
  return tokenData.userId;
}

// Função para remover um token usado
async function removePasswordResetToken(token: string): Promise<void> {
  await storage.deletePasswordResetToken(token);
}

export { hashPassword, generatePasswordResetToken, verifyPasswordResetToken, removePasswordResetToken, sendPasswordResetEmail };

function setupAuth(app: Express) {
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "salon-beauty-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Estratégia de autenticação local
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  // Estratégia de autenticação do Google (configurada se as credenciais estiverem disponíveis)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    
    
    // Detectar automaticamente a URL do ambiente
    const MemoryStore = createMemoryStore(session);

// 1. Função auxiliar declarada no escopo global
function getBaseUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(',')[0];
    return domain.startsWith('http') ? domain : `https://${domain}`;
  }
  return "http://localhost:3001";
}

// 2. Função principal que configura a autenticação
function setupAuth(app: Express) {
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "barbearia-secret-key",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configuração da estratégia do Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const baseUrl = getBaseUrl();
    const googleCallbackUrl = `${baseUrl}/api/auth/google/callback`;

    console.log("Google Callback URL configurada:", googleCallbackUrl);

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: googleCallbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Lógica padrão de persistência de usuário
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error("No email found"));

            let user = await storage.getUserByUsername(email);
            if (!user) {
              user = await storage.createUser({
                username: email,
                password: "oauth-generated-password",
                name: profile.displayName,
                isAdmin: false,
              });
            }
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
    
    // Verificar se as credenciais do Google são válidas
    if (!process.env.GOOGLE_CLIENT_ID.includes('.googleusercontent.com')) {
    }
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: callbackUrl,
          scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            
            
            // Verificar se o usuário já existe no sistema
            const email = profile.emails?.[0]?.value;
            if (!email) {
              
              return done(new Error("No email found in Google profile"));
            }
            
            let user = await storage.getUserByUsername(email);
            
            // Se o usuário não existir, criar um novo automaticamente
            if (!user) {
              
              user = await storage.createUser({
                username: email,
                password: await hashPassword(randomBytes(16).toString('hex')), // Senha aleatória
                name: profile.displayName || email.split('@')[0],
                phone: "", // Campo obrigatório, mas pode ser vazio para usuários do Google
                isAdmin: false
              });
              
            } else {
              
            }
            
            return done(null, user);
          } catch (error) {
            
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, phone } = req.body;
      
      // Validar campos obrigatórios
      if (!username || !password || !name || !phone) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
      // Validar formato de email
      if (!username.includes('@') || !username.includes('.')) {
        return res.status(400).json({ message: "Email inválido" });
      }
      
      // Validar tamanho da senha
      if (password.length < 6) {
        return res.status(400).json({ message: "Senha deve ter no mínimo 6 caracteres" });
      }
      
      // Validar nome
      if (name.length < 3) {
        return res.status(400).json({ message: "Nome deve ter pelo menos 3 caracteres" });
      }
      
      // Validar telefone
      if (phone.length < 10) {
        return res.status(400).json({ message: "Telefone inválido" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Já existe uma conta com este email" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        name,
        phone,
        isAdmin: false // Novos usuários não são admin por padrão
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send the password hash to the client
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("[REGISTER ERROR]", error?.message || error);
      const msg = error?.message || "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return res.status(400).json({ message: "Já existe uma conta com este email" });
      }
      res.status(500).json({ message: "Erro interno do servidor: " + (error?.message || "desconhecido") });
    }
  });

  app.post("/api/login", (req, res, next) => {
    const rememberMe = req.body?.rememberMe === true;
    passport.authenticate("local", (err: Error | null, user: Express.User | false | null, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Email ou senha inválidos" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Estende a sessão para 30 dias se "Lembrar-me" estiver marcado
        if (rememberMe) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
        } else {
          req.session.cookie.expires = undefined; // Sessão de navegador (apaga ao fechar)
        }
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send the password hash to the client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Rotas de autenticação do Google
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Rota para iniciar o processo de autenticação do Google
    app.get("/api/auth/google", (req, res, next) => {
      
      
      passport.authenticate("google", {
        scope: ['profile', 'email']
      })(req, res, next);
    });
    
    // Rota para callback do Google após autenticação
    app.get(
      "/api/auth/google/callback",
      (req, res, next) => {
        
        
        passport.authenticate("google", (err: Error | null, user: Express.User | false | null, info: any) => {
          
          
          if (err) {
            
            return res.redirect("/auth?error=" + encodeURIComponent("Erro na autenticação: " + err.message));
          }
          
          if (!user) {
            
            return res.redirect("/auth?error=Falha+na+autenticação+com+o+Google");
          }
          
          
          
          req.login(user, (loginErr) => {
            if (loginErr) {
              
              return res.redirect("/auth?error=" + encodeURIComponent("Erro ao fazer login: " + loginErr.message));
            }
            
            
            
            
            
            // Sucesso - redirecionar para a página inicial
            return res.redirect("/");
          });
        })(req, res, next);
      }
    );
  }
  
 // Rotas de reset password implementadas em routes.ts
}

export { setupAuth };

