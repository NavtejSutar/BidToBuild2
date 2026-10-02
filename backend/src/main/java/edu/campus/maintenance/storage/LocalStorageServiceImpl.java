package edu.campus.maintenance.storage;

import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;

@Slf4j
@Service
public class LocalStorageServiceImpl implements FileStorageService {

    private final Path fileStorageLocation;
    private final long maxSizeBytes;

    public LocalStorageServiceImpl(
            @Value("${app.storage.upload-dir:uploads}") String uploadDir,
            @Value("${app.storage.max-file-size-bytes:10485760}") long maxSizeBytes) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxSizeBytes = maxSizeBytes;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Initialized file storage at {}", this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > maxSizeBytes) {
            throw new BadRequestException("File size exceeds maximum allowable limit of " + (maxSizeBytes / (1024 * 1024)) + "MB");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");
        String extension = getFileExtension(originalFilename);

        validateMagicBytes(file, extension);

        String uniqueFilename = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }
            return uniqueFilename;
        } catch (IOException ex) {
            log.error("Could not store file {}", uniqueFilename, ex);
            throw new RuntimeException("Could not store file. Please try again.", ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String filename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found: " + filename);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found: " + filename);
        }
    }

    @Override
    public void deleteFile(String filename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.warn("Failed to delete file: {}", filename);
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex + 1).toLowerCase();
    }

    private void validateMagicBytes(MultipartFile file, String extension) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[12];
            int read = is.read(header);
            if (read < 4) {
                throw new BadRequestException("Invalid file format");
            }

            // JPEG: FF D8 FF
            boolean isJpeg = (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
            // PNG: 89 50 4E 47
            boolean isPng = (header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50 && (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47;
            // WEBP: RIFF....WEBP (header[0..3] == "RIFF", header[8..11] == "WEBP")
            boolean isWebp = read >= 12 &&
                    header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F' &&
                    header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            // GIF: GIF8
            boolean isGif = header[0] == 'G' && header[1] == 'I' && header[2] == 'F' && header[3] == '8';

            if (!isJpeg && !isPng && !isWebp && !isGif) {
                throw new BadRequestException("Uploaded file is not a supported image (JPEG, PNG, WEBP, GIF allowed)");
            }
        } catch (IOException e) {
            throw new BadRequestException("Could not read file header for verification");
        }
    }
}
