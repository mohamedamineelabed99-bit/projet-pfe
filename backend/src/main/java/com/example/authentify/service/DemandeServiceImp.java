package com.example.authentify.service;
import java.nio.charset.StandardCharsets;
import java.util.List;
import com.example.authentify.entity.DemandeEntity;
//import com.example.authentify.entity.OrganismeEntity;
import com.example.authentify.io.ProfileRequest;
import com.example.authentify.io.DemandeRequest;
import com.example.authentify.io.OrganismeResponse;
import com.example.authentify.io.ProfileResponse;
import com.example.authentify.repository.DemandeRepository;
import com.example.authentify.repository.UserRepository;
//import com.example.authentify.repository.OrganismeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
//import java.util.UUID;
import java.net.URLEncoder;
//import java.nio.charset.StandardCharsets;


@Service
@RequiredArgsConstructor
public class DemandeServiceImp implements DemandeService {
    private final DemandeRepository demandeRepository;
    private final UserRepository userRepository;
    //private final OrganismeRepository organismeRepository;
    private final EmailService emailService;

    
    public DemandeEntity createDemande(DemandeRequest request) {
    // Check if a user with the same email already exists
    if (userRepository.existsByEmail(request.getEmail())) {
        throw new RuntimeException("Cet email est déjà utilisé");
    }
    
    // Check if a demande with the same email already exists
    if (demandeRepository.existsByEmail(request.getEmail())) {
        throw new RuntimeException("Une demande avec cet email existe déjà");
    }
   /*  if(demandeRepository.existsByEmailOrganisme(request.getEmailOrganisme())) {
        throw new RuntimeException("Cet email d'organisme est déjà utilisé");
    }*/

    // Convert the request to an entity using your existing method
    DemandeEntity newDemande = convertToDemandeEntity(request);

    // Save the entity to the database
    DemandeEntity savedDemande = demandeRepository.save(newDemande);

    // Return the saved entity
    return savedDemande;
}


    @Override
    public void deleteDemande(Long id) {
        DemandeEntity demande = demandeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Demande not found with id: " + id));
        demandeRepository.delete(demande);
}

    private DemandeEntity convertToDemandeEntity(DemandeRequest request) {
        DemandeEntity demandeEntity = DemandeEntity.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .telephone(request.getTelephone())
                .adresseResp(request.getAdresseResp())
                .nomOrganisme(request.getNomOrganisme())
                .typeOrganisme(request.getTypeOrganisme())
                .role(request.getRole())
                .jobRole(request.getJobRole())
                //.description(request.getDescription())
                .emailOrganisme(request.getEmailOrganisme())
                .adresse(request.getAdresse())
                .fax(request.getFax())
                .secteur(request.getSecteur())
                .dateCreation(request.getDateCreation())
                .logoUrl(request.getLogoUrl())
                .build();
        return demandeEntity;
    }

    private ProfileResponse convertToDemandeResponse(DemandeEntity demande) {

    OrganismeResponse organisme = OrganismeResponse.builder()
            .nomOrganisme(demande.getNomOrganisme())
            .emailOrganisme(demande.getEmailOrganisme())
            .adresse(demande.getAdresse())
            .secteur(demande.getSecteur())
            .telephone(demande.getTelephone())
            .fax(demande.getFax())
            .type(demande.getTypeOrganisme())
            .dateCreation(demande.getDateCreation())
            .build();


    return ProfileResponse.builder()
            .id(demande.getId())
            .nom(demande.getNom())
            .prenom(demande.getPrenom())
            .email(demande.getEmail())
            .role(demande.getRole())
            .organisme(organisme)
            .build();
}
    public ProfileResponse loginDemande(ProfileRequest request) {
        DemandeEntity demande = demandeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Demande not found with email: " + request.getEmail()));
        return convertToDemandeResponse(demande);
    }

    @Override
    public List<DemandeEntity> getAllDemandes() {
        return demandeRepository.findAll();
    }
    @Override
    public DemandeEntity validerDemande(Long id) {
        DemandeEntity demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found with id: " + id));
        demande.setEtat("validé");
        DemandeEntity savedDemande= demandeRepository.save(demande);

    // Generate a validation URL
        /*String validationUrl = "http://localhost:5173/verifyAccount?email="
            + URLEncoder.encode(savedDemande.getEmail(), StandardCharsets.UTF_8); */
        String validationUrl = "https://projet-pfe-livid.vercel.app/verifyAccount?email="
                    + URLEncoder.encode(savedDemande.getEmail(), StandardCharsets.UTF_8); ;

    // Send validation email
        emailService.sendValidationEmailAsync(savedDemande.getEmail(), validationUrl);
        /*if(!emailSent){
            System.out.println("Warning: Failed to send validation email to " + savedDemande.getEmail());
    }*/
    return savedDemande;
}
    
    @Override
    public void refuserDemande(Long id) {
        DemandeEntity demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found with id: " + id));
        demande.setEtat("refusé");
        demandeRepository.save(demande);
    }


    

}
