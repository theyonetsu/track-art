-- Achat de toutes les photos en un forfait
ALTER TABLE "Gallery" ADD COLUMN "allPhotosPrice" INTEGER;
ALTER TABLE "User" ADD COLUMN "defaultAllPhotosPrice" INTEGER;
