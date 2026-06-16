import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { seedDefaultImages } from "./seed-default-images";

export async function cleanupBrokenImageReferences() {
  
  
  
  // LIMPEZA COMPLETAMENTE DESABILITADA PARA PROTEGER IMAGENS DO USUÁRIO
  // Só executar verificação sem modificar nada
  try {
    const services = await storage.getServices();
    
    
    for (const service of services) {
      if (service.imageUrl && service.imageUrl.startsWith('/uploads/')) {
        const imagePath = path.join(process.cwd(), service.imageUrl);
        if (!fs.existsSync(imagePath)) {
          
        } else {
          
        }
      }
    }
    
    const banner = await storage.getBanner();
    if (banner?.backgroundImage && banner.backgroundImage.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), banner.backgroundImage);
      if (!fs.existsSync(imagePath)) {
        
      } else {
        
      }
    }
    
    
    
    // SEED TAMBÉM DESABILITADO PARA PROTEGER IMAGENS PERSONALIZADAS
    // await seedDefaultImages();
    
  } catch (error) {
    
  }
}