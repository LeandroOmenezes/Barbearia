import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, generatePasswordResetToken, verifyPasswordResetToken, removePasswordResetToken, sendPasswordResetEmail } from "./auth";

import { insertAppointmentSchema, insertSaleSchema, insertReviewSchema, insertBannerSchema, insertFooterSchema, insertPriceItemSchema, insertServiceSchema, insertCategorySchema, insertSiteConfigSchema, insertProfessionalSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({
    storage: storage_config,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Apenas imagens JPEG, PNG e WebP são permitidas'));
      }
    }
  });
  
  app.use('/uploads', express.static(uploadsDir));
  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });
  
  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClientById(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client" });
    }
  });
  
  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { name, phone, email } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }
      
      const client = await storage.createClient({ name, phone, email });
      res.status(201).json(client);
    } catch (error: any) {
      console.error("[CREATE CLIENT ERROR]", error?.message || error);
      const msg = error?.message || "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return res.status(400).json({ message: "Já existe um cliente com este e-mail" });
      }
      res.status(500).json({ message: "Erro ao criar cliente: " + (error?.message || "desconhecido") });
    }
  });
  
  app.patch("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const { name, phone, email } = req.body;
      const client = await storage.updateClient(id, { name, phone, email });
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error updating client" });
    }
  });
  
  app.delete("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting client" });
    }
  });
  
  // === Categories ===
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  // === Services ===
  app.get("/api/services/all", async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services" });
    }
  });
  
  app.get("/api/services/featured", async (req: Request, res: Response) => {
    try {
      const services = await storage.getFeaturedServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching featured services" });
    }
  });
  
  app.get("/api/services/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const services = await storage.getServicesByCategory(categoryId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services by category" });
    }
  });

  // Upload image for service
  app.post("/api/services/:id/upload-image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem fazer upload de imagens." });
      }

      const serviceId = parseInt(req.params.id);
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
      }

      // Read the file and convert to base64
      const imageBuffer = fs.readFileSync(req.file.path);
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      
      // Update service with image data in database
      const updatedService = await storage.updateServiceImageData(serviceId, imageBase64, mimeType);
      
      // Remove the temporary uploaded file
      fs.unlinkSync(req.file.path);
      
      if (!updatedService) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      res.json({
        message: "Imagem salva com sucesso no banco de dados",
        service: updatedService,
        imageUrl: `/api/images/service/${serviceId}`
      });
    } catch (error) {
      
      // Remove the uploaded file if an error occurred
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          
        }
      }
      res.status(500).json({ message: "Erro ao fazer upload da imagem" });
    }
  });

  // === Service Management (Admin Only) ===
  app.post("/api/admin/services", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem criar serviços." });
      }

      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      
      res.status(201).json({
        message: "Serviço criado com sucesso",
        service
      });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados do serviço inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar serviço" });
      }
    }
  });

  app.delete("/api/admin/services/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem remover serviços." });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteService(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      res.json({ message: "Serviço removido com sucesso" });
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao remover serviço" });
    }
  });

  app.patch("/api/admin/services/:id/featured", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem alterar destaque de serviços." });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }

      const { featured } = req.body;
      if (typeof featured !== 'boolean') {
        return res.status(400).json({ message: "O campo featured deve ser um valor booleano" });
      }

      const updated = await storage.updateServiceFeatured(id, featured);
      
      if (!updated) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      res.json({ message: "Status de destaque atualizado com sucesso" });
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao atualizar status de destaque" });
    }
  });

  app.put("/api/admin/services/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem editar serviços." });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }

      const validatedData = insertServiceSchema.parse(req.body);
      const updated = await storage.updateService(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      res.json({ message: "Serviço atualizado com sucesso", service: updated });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados do serviço inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar serviço" });
      }
    }
  });

  // === Category Management (Admin Only) ===
  app.post("/api/admin/categories", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem criar categorias." });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      
      res.status(201).json({
        message: "Categoria criada com sucesso",
        category
      });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados da categoria inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar categoria" });
      }
    }
  });

  app.put("/api/admin/categories/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem editar categorias." });
      }

      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      res.json({
        message: "Categoria atualizada com sucesso",
        category
      });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados da categoria inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar categoria" });
      }
    }
  });

  app.delete("/api/admin/categories/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem remover categorias." });
      }

      const id = parseInt(req.params.id);
      
      // Check if there are services or price items in this category
      const services = await storage.getServicesByCategory(id);
      const priceItems = await storage.getPriceItemsByCategory(id);
      
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      const deletedCount = services.length + priceItems.length;
      res.json({ 
        message: `Categoria removida com sucesso. ${deletedCount} itens relacionados também foram removidos.`,
        deletedServices: services.length,
        deletedPriceItems: priceItems.length
      });
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao remover categoria" });
    }
  });
  
  // === Price Items ===
  app.get("/api/prices", async (req: Request, res: Response) => {
    try {
      const priceItems = await storage.getPriceItems();
      res.json(priceItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching price items" });
    }
  });
  
  app.get("/api/prices/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const priceItems = await storage.getPriceItemsByCategory(categoryId);
      res.json(priceItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching price items by category" });
    }
  });

  // === Price Management (Admin Only) ===
  app.post("/api/admin/prices", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem criar preços." });
      }

      const priceData = insertPriceItemSchema.parse(req.body);
      const priceItem = await storage.createPriceItem(priceData);
      
      res.status(201).json({
        message: "Item de preço criado com sucesso",
        priceItem
      });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados do preço inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar item de preço" });
      }
    }
  });

  app.put("/api/admin/prices/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem editar preços." });
      }

      const id = parseInt(req.params.id);
      const priceData = insertPriceItemSchema.partial().parse(req.body);
      const updatedPriceItem = await storage.updatePriceItem(id, priceData);
      
      if (!updatedPriceItem) {
        return res.status(404).json({ message: "Item de preço não encontrado" });
      }

      res.json({
        message: "Item de preço atualizado com sucesso",
        priceItem: updatedPriceItem
      });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados do preço inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar item de preço" });
      }
    }
  });

  app.delete("/api/admin/prices/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem remover preços." });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deletePriceItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Item de preço não encontrado" });
      }

      res.json({ message: "Item de preço removido com sucesso" });
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao remover item de preço" });
    }
  });
  
  // === Appointments ===
  // Nova rota para buscar horários disponíveis
  app.get("/api/appointments/available-times/:date", async (req: Request, res: Response) => {
    try {
      const date = req.params.date;
      const professionalId = req.query.professionalId ? parseInt(req.query.professionalId as string) : null;
      
    // Gerar todos os horários possíveis (intervalo de 30 minutos)
      const generateTimeSlots = () => {
        const slots = [];
        const startTime = 8 * 60; // 08:00 em minutos (540 minutos)
        const endTime = 19 * 60; // 19:00 em minutos (1140 minutos)
        const interval = 30; // 30 minutos
        
        for (let time = startTime; time < endTime; time += interval) {
          const hour = Math.floor(time / 60);
          const minute = time % 60;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeString);
        }
        
        return slots;
      };
      
      const allTimeSlots = generateTimeSlots();
      
      // Buscar agendamentos existentes para a data (filtrados por profissional se informado)
      const existingAppointments = await storage.getAppointments();
      const bookedTimes = existingAppointments
        .filter(appointment => 
          appointment.date === date && 
          (appointment.status === 'pending' || appointment.status === 'confirmed') &&
          (professionalId === null || appointment.professionalId === professionalId)
        )
        .map(appointment => appointment.time);
      
      // Verificar se a data está bloqueada (geral ou para o profissional específico)
      const blockStatus = await storage.isDateBlocked(date, professionalId);

      // Criar lista de horários com status
      const timeSlots = allTimeSlots.map(time => ({
        time,
        available: blockStatus.blocked ? false : !bookedTimes.includes(time),
        status: blockStatus.blocked ? 'blocked' : (bookedTimes.includes(time) ? 'occupied' : 'available')
      }));
      
      res.json({ timeSlots, blocked: blockStatus.blocked, blockReason: blockStatus.reason, blockDescription: blockStatus.description });
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao buscar horários disponíveis" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "É necessário estar logado para agendar um horário" });
      }

      const appointmentData = insertAppointmentSchema.parse(req.body);

      // Verificar se a data está bloqueada
      const blockStatus = await storage.isDateBlocked(appointmentData.date);
      if (blockStatus.blocked) {
        return res.status(409).json({
          message: `Esta data está bloqueada: ${blockStatus.reason}. ${blockStatus.description ?? ''}`.trim()
        });
      }
      
      // Verificar se já existe um agendamento no mesmo horário
      const existingAppointments = await storage.getAppointments();
      const conflictingAppointment = existingAppointments.find(existing => 
        existing.date === appointmentData.date && 
        existing.time === appointmentData.time &&
        (existing.status === 'pending' || existing.status === 'confirmed')
      );
      
      if (conflictingAppointment) {
        return res.status(409).json({ 
          message: "Este horário já está ocupado. Por favor, escolha outro horário disponível."
        });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados de agendamento inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar agendamento" });
      }
    }
  });
  
  app.get("/api/appointments", async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário está autenticado e é admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const appointments = await storage.getAppointments();
      
      res.json(appointments);
    } catch (error) {
      
      res.status(500).json({ message: "Error fetching appointments" });
    }
  });


  app.get("/api/my-appointments", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user as any;
      const allAppointments = await storage.getAppointments();
      

      const userAppointments = allAppointments.filter(appointment => 
        appointment.email === user.username
      );
      
      
      res.json(userAppointments);
    } catch (error) {
      
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/appointments/:id/status", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id) || !status) {
        return res.status(400).json({ message: "Invalid request data" });
      }


      const originalAppointment = await storage.getAppointmentById(id);
      
      if (!originalAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }


      const appointment = await storage.updateAppointmentStatus(id, status);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }



      
      res.json(appointment);
    } catch (error) {
      
      res.status(500).json({ message: "Error updating appointment status" });
    }
  });
  

  app.get("/api/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });
  
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "É necessário estar logado para enviar avaliações" });
      }
      
      // Se o nome do cliente não for fornecido, usar o nome do usuário logado
      if (!req.body.clientName && req.user) {
        req.body.clientName = req.user.name || req.user.username;
      }
      
      // Validar os dados da avaliação
      const reviewData = insertReviewSchema.parse(req.body);
      
      // Adicionar userId se o usuário está autenticado
      const reviewWithUser = {
        ...reviewData,
        userId: req.user?.id || null
      };
      
      // Criar a avaliação
      const review = await storage.createReview(reviewWithUser);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados de avaliação inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar avaliação" });
      }
    }
  });
  
  // Rota para dar/remover like (coração ou joinha) em uma avaliação
  app.post("/api/reviews/:id/like/:likeType", async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);
      const likeType = req.params.likeType as 'heart' | 'thumbs';
      
      // Verificar se o tipo de like é válido
      if (likeType !== 'heart' && likeType !== 'thumbs') {
        return res.status(400).json({ message: "Tipo de like inválido" });
      }
      
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "É necessário estar logado para curtir avaliações" });
      }
      
      const result = await storage.toggleLikeReview(reviewId, req.user.id, likeType);
      
      if (!result) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      res.status(200).json({
        review: result.review,
        userLiked: result.userLiked
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao processar like na avaliação" });
    }
  });

  // Rota para obter os likes do usuário
  app.get("/api/user/likes", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "É necessário estar logado" });
      }
      
      const userLikes = await storage.getUserLikes(req.user.id);
      res.status(200).json(userLikes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar likes do usuário" });
    }
  });

  // === Review Comments ===
  app.get("/api/reviews/:reviewId/comments", async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "ID da avaliação inválido" });
      }

      const comments = await storage.getReviewComments(reviewId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar comentários" });
    }
  });

  app.post("/api/reviews/:reviewId/comments", async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "ID da avaliação inválido" });
      }

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "É necessário estar logado para comentar" });
      }

      // Validar dados do comentário
      const { comment } = req.body;
      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: "Comentário não pode estar vazio" });
      }

      // Criar comentário
      const newComment = await storage.createReviewComment({
        reviewId,
        comment: comment.trim(),
        userId: req.user.id,
        userName: req.user.name || req.user.username
      });

      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar comentário" });
    }
  });

  app.post("/api/comments/:commentId/like/:likeType", async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const likeType = req.params.likeType as 'heart' | 'thumbs';
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "ID do comentário inválido" });
      }

      if (!['heart', 'thumbs'].includes(likeType)) {
        return res.status(400).json({ message: "Tipo de like inválido" });
      }

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "É necessário estar logado para curtir comentários" });
      }
      
      const result = await storage.toggleLikeComment(commentId, req.user.id, likeType);

      if (!result) {
        return res.status(404).json({ message: "Comentário não encontrado" });
      }

      res.status(200).json({
        comment: result.comment,
        userLiked: result.userLiked,
        likeType
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao processar like no comentário" });
    }
  });

  app.get("/api/user/comment-likes", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "É necessário estar logado" });
      }

      const userCommentLikes = await storage.getUserCommentLikes(req.user.id);
      res.status(200).json(userCommentLikes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar likes de comentários do usuário" });
    }
  });
  
  // === Admin Users Management ===
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/admin/users", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { username, password, name, phone, isAdmin } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        phone,
        isAdmin: isAdmin || false
      });
      
      // Remove password from response
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Prevent deleting own account
      if (req.user?.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // === Sales ===
  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const saleData = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(saleData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating sale" });
      }
    }
  });
  
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales" });
    }
  });
  
  app.patch("/api/sales/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid sale id" });
      const sale = await storage.updateSale(id, req.body);
      if (!sale) return res.status(404).json({ message: "Sale not found" });
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Error updating sale" });
    }
  });

  app.patch("/api/sales/:id/cancel", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid sale id" });
      const { reason } = req.body;
      const sale = await storage.cancelSale(id, reason);
      if (!sale) return res.status(404).json({ message: "Sale not found" });
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Error cancelling sale" });
    }
  });

  app.get("/api/sales/filter", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const sales = await storage.getSalesByDate(start, end);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching filtered sales" });
    }
  });

  // === Password Reset Routes ===
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        // Por segurança, não informamos se o email existe ou não
        return res.status(200).json({ message: "Se o email estiver cadastrado, você receberá um link de recuperação" });
      }
      
      // Gerar token de recuperação
      const resetToken = await generatePasswordResetToken(user.id);
      
      // Enviar email
      const baseUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}`
        : 'http://localhost:5000';
      const resetLink = `${baseUrl}/reset-password/${resetToken}`;
      
      try {
        const emailSent = await sendPasswordResetEmail(email, resetToken);
        if (emailSent) {
          res.status(200).json({ message: "Link de recuperação enviado para seu email" });
        } else {
          // Email não pôde ser enviado — retornar link para exibição direta na tela
          res.status(200).json({
            message: "Não foi possível enviar o email automaticamente. Use o link abaixo para redefinir sua senha:",
            resetLink,
            emailFailed: true
          });
        }
      } catch (error) {
        res.status(500).json({ message: "Erro ao gerar link de recuperação. Tente novamente mais tarde." });
      }
    } catch (error) {
      
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/reset-password/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }
      
      const userId = await verifyPasswordResetToken(token);
      const valid = userId !== null;
      res.status(200).json({ valid });
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar token" });
    }
  });

  app.post("/api/reset-password/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token e senha são obrigatórios" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Senha deve ter no mínimo 6 caracteres" });
      }
      
      const userId = await verifyPasswordResetToken(token);
      if (!userId) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      
      // Hash da nova senha
      const hashedPassword = await hashPassword(password);
      
      // Atualizar senha do usuário
      const user = await storage.updateUserPassword(userId, hashedPassword);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remover token usado
      await removePasswordResetToken(token);
      
      res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // === Banner Management ===
  app.get("/api/banner", async (req: Request, res: Response) => {
    try {
      const banner = await storage.getBanner();
      res.json(banner);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar configuração do banner" });
    }
  });

  app.put("/api/banner", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem editar o banner." });
      }

      const bannerData = insertBannerSchema.parse(req.body);
      const banner = await storage.updateBanner(bannerData);
      
      res.json({
        message: "Banner atualizado com sucesso",
        banner
      });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados do banner inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar banner" });
      }
    }
  });

  // Upload background image for banner
  app.post("/api/banner/upload-image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem fazer upload de imagens." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
      }

      // Read the file and convert to base64
      const imageBuffer = fs.readFileSync(req.file.path);
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      
      // Update banner with image data in database
      const updatedBanner = await storage.updateBannerImageData(imageBase64, mimeType);
      
      // Remove the temporary uploaded file
      fs.unlinkSync(req.file.path);
      
      if (!updatedBanner) {
        return res.status(404).json({ message: "Configuração de banner não encontrada" });
      }

      res.json({
        message: "Imagem de fundo do banner salva no banco de dados",
        banner: updatedBanner,
        imageUrl: "/api/images/banner"
      });
    } catch (error) {
      
      // Remove the uploaded file if an error occurred
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          
        }
      }
      res.status(500).json({ message: "Erro ao fazer upload da imagem do banner" });
    }
  });

  // === Footer Management ===
  app.get("/api/footer", async (req: Request, res: Response) => {
    try {
      const footer = await storage.getFooter();
      res.json(footer);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar configuração do rodapé" });
    }
  });

  app.put("/api/footer", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem editar o rodapé." });
      }

      const footerData = insertFooterSchema.parse(req.body);
      const footer = await storage.updateFooter(footerData);
      
      res.json({
        message: "Rodapé atualizado com sucesso",
        footer
      });
    } catch (error) {
      console.error("Erro ao atualizar rodapé:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados do rodapé inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar rodapé" });
      }
    }
  });

  // === Site Configuration ===
  app.get("/api/site-config", async (req: Request, res: Response) => {
    try {
      const config = await storage.getSiteConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar configuração do site" });
    }
  });

  app.put("/api/site-config", async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem editar as configurações do site." });
      }

      const configData = insertSiteConfigSchema.parse(req.body);
      const config = await storage.updateSiteConfig(configData);
      
      res.json({
        message: "Configuração do site atualizada com sucesso",
        config
      });
    } catch (error) {
      
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados da configuração inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar configuração do site" });
      }
    }
  });

  app.post("/api/site-config/upload-logo", upload.single('logo'), async (req: Request, res: Response) => {
    try {
      // Only allow authenticated admin users
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem fazer upload da logo." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
      }

      // Convert the uploaded file to a Base64 data URL so it persists in the database
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const logoUrl = `data:${mimeType};base64,${base64Data}`;

      // Remove the temporary file from disk — not needed anymore
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      
      // Update site config with new logo stored as Base64
      const updatedConfig = await storage.updateSiteLogo(logoUrl);
      
      if (!updatedConfig) {
        return res.status(404).json({ message: "Configuração do site não encontrada" });
      }

      res.json({
        message: "Logo do site atualizada com sucesso",
        config: updatedConfig,
        logoUrl
      });
    } catch (error) {
      
      // Remove the uploaded file if an error occurred
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          
        }
      }
      res.status(500).json({ message: "Erro ao fazer upload da logo" });
    }
  });

  // Upload appointment section background image
  app.post("/api/site-config/upload-appointment-background", upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem fazer upload." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype;

      try { fs.unlinkSync(req.file.path); } catch (_) {}
      
      const config = await storage.getSiteConfig();
      if (!config) {
        return res.status(404).json({ message: "Configuração do site não encontrada" });
      }

      const updatedConfig = await storage.updateSiteConfig({
        siteName: config.siteName,
        siteSlogan: config.siteSlogan || undefined,
        logoUrl: config.logoUrl || undefined,
        primaryColor: config.primaryColor || undefined,
        appointmentBackgroundImageBase64: base64Data,
        appointmentBackgroundImageMimeType: mimeType,
      });

      res.json({
        message: "Imagem de fundo de agendamento atualizada com sucesso",
        config: updatedConfig,
      });
    } catch (error) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      res.status(500).json({ message: "Erro ao fazer upload da imagem de fundo" });
    }
  });

  // === Professionals ===
  app.get("/api/professionals", async (req: Request, res: Response) => {
    try {
      const list = await storage.getProfessionals();
      res.json(list);
    } catch {
      res.status(500).json({ message: "Erro ao buscar profissionais" });
    }
  });

  app.get("/api/professionals/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const list = await storage.getProfessionalsByCategory(categoryId);
      res.json(list);
    } catch {
      res.status(500).json({ message: "Erro ao buscar profissionais da categoria" });
    }
  });

  app.post("/api/admin/professionals", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const data = insertProfessionalSchema.parse(req.body);
      const professional = await storage.createProfessional(data);
      res.status(201).json(professional);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar profissional" });
      }
    }
  });

  app.put("/api/admin/professionals/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      const data = insertProfessionalSchema.partial().parse(req.body);
      const updated = await storage.updateProfessional(id, data);
      if (!updated) return res.status(404).json({ message: "Profissional não encontrado" });
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar profissional" });
      }
    }
  });

  app.patch("/api/admin/professionals/:id/active", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      const { active } = req.body;
      const updated = await storage.updateProfessional(id, { active });
      if (!updated) return res.status(404).json({ message: "Profissional não encontrado" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  app.delete("/api/admin/professionals/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProfessional(id);
      if (!deleted) return res.status(404).json({ message: "Profissional não encontrado" });
      res.json({ message: "Profissional removido com sucesso" });
    } catch {
      res.status(500).json({ message: "Erro ao remover profissional" });
    }
  });

  app.post("/api/professionals/:id/upload-photo", upload.single("photo"), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (!req.file) return res.status(400).json({ message: "Nenhuma foto enviada" });
      const id = parseInt(req.params.id);
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Data = fileBuffer.toString("base64");
      const mimeType = req.file.mimetype;
      fs.unlinkSync(req.file.path);
      const updated = await storage.uploadProfessionalPhoto(id, base64Data, mimeType);
      if (!updated) return res.status(404).json({ message: "Profissional não encontrado" });
      res.json({ message: "Foto enviada com sucesso", professional: updated });
    } catch {
      res.status(500).json({ message: "Erro ao fazer upload da foto" });
    }
  });

  // === Schedule Blocks ===
  app.get("/api/schedule-blocks", async (req: Request, res: Response) => {
    try {
      const blocks = await storage.getScheduleBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar bloqueios de agenda" });
    }
  });

  app.post("/api/schedule-blocks", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem bloquear a agenda." });
      }
      const { insertScheduleBlockSchema } = await import("@shared/schema");
      const blockData = insertScheduleBlockSchema.parse(req.body);
      if (blockData.endDate < blockData.startDate) {
        return res.status(400).json({ message: "A data de fim não pode ser anterior à data de início." });
      }
      const block = await storage.createScheduleBlock(blockData);
      res.status(201).json(block);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar bloqueio de agenda" });
      }
    }
  });

  app.delete("/api/schedule-blocks/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado." });
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteScheduleBlock(id);
      if (!deleted) {
        return res.status(404).json({ message: "Bloqueio não encontrado" });
      }
      res.json({ message: "Bloqueio removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover bloqueio" });
    }
  });

  // === User Profile Image Routes ===
  // Test endpoint for debugging authentication
  app.get("/api/user/test-auth", (req: Request, res: Response) => {
    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    });
  });

  // Atualizar telefone/WhatsApp do usuário logado
  app.patch("/api/user/phone", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
    const { phone } = req.body;
    if (!phone || String(phone).trim().length < 10) {
      return res.status(400).json({ message: "Número de telefone inválido" });
    }
    try {
      const updated = await storage.updateClient(req.user.id, { phone: String(phone).trim() });
      if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
      // Atualizar sessão com o novo telefone
      (req.user as any).phone = updated.phone;
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar telefone" });
    }
  });

  // Upload de imagem de perfil do usuário
  app.post("/api/user/upload-profile-image", upload.single('profileImage'), async (req: Request, res: Response) => {
    
    
    
    
    
    
    
    if (req.file) {
      
    }

    if (!req.isAuthenticated()) {
      
      return res.status(401).json({ error: "Login necessário" });
    }

    if (!req.file) {
      
      return res.status(400).json({ error: "Arquivo de imagem necessário" });
    }

    try {
      // Ler o arquivo e converter para base64
      const imageBuffer = fs.readFileSync(req.file.path);
      const imageDataBase64 = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;

      // Atualizar usuário no banco
      const updatedUser = await storage.updateUserProfileImage(req.user.id, imageDataBase64, mimeType);
      
      // Remover arquivo temporário
      fs.unlinkSync(req.file.path);

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ message: "Imagem de perfil atualizada com sucesso", user: updatedUser });
    } catch (error) {
      
      // Limpar arquivo temporário em caso de erro
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // === Image Serving Routes ===
  
  // Serve user profile images from database
  app.get("/api/images/user/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user || !user.profileImageBase64 || !user.profileImageMimeType) {
        return res.status(404).json({ error: "Imagem de perfil não encontrada" });
      }

      // Converter base64 para buffer
      const imageBuffer = Buffer.from(user.profileImageBase64, 'base64');

      // Configurar headers
      res.set({
        'Content-Type': user.profileImageMimeType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400' // Cache por 24 horas
      });

      res.send(imageBuffer);
    } catch (error) {
      
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Serve service images from database
  app.get("/api/images/service/:id", async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }

      const service = await storage.getServiceById(serviceId);
      if (!service || !service.imageDataBase64) {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }

      // Convert base64 back to buffer
      const imageBuffer = Buffer.from(service.imageDataBase64, 'base64');
      
      // Set proper content type
      res.set('Content-Type', service.imageMimeType || 'image/jpeg');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.send(imageBuffer);
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao servir imagem" });
    }
  });

  // Serve banner image from database
  app.get("/api/images/banner", async (req: Request, res: Response) => {
    try {
      const banner = await storage.getBanner();
      if (!banner || !banner.backgroundImageDataBase64) {
        return res.status(404).json({ message: "Imagem do banner não encontrada" });
      }

      // Convert base64 back to buffer
      const imageBuffer = Buffer.from(banner.backgroundImageDataBase64, 'base64');
      
      // Set proper content type
      res.set('Content-Type', banner.backgroundImageMimeType || 'image/jpeg');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      res.send(imageBuffer);
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao servir imagem do banner" });
    }
  });

  // === Regeneração de Imagens ===
  app.post("/api/admin/regenerate-images", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // LIMPEZA DESABILITADA PARA PROTEGER IMAGENS PERSONALIZADAS
      
      
      res.json({ 
        message: "Regeneração de imagens desabilitada para proteger suas imagens personalizadas",
        success: false,
        note: "Suas imagens estão protegidas e não serão removidas"
      });
    } catch (error) {
      
      res.status(500).json({ message: "Erro ao processar regeneração de imagens" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
