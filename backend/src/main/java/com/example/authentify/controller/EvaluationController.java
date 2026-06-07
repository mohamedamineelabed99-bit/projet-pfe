package com.example.authentify.controller;

//import com.example.authentify.repository.EvaluationRepository;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.authentify.entity.EvaluationEntity;
import com.example.authentify.entity.OrganismeEntity;
import com.example.authentify.entity.PrincipeEntity;
import com.example.authentify.entity.ReponseEntity;

//import com.example.authentify.entity.OrganismeEntity;

//import com.example.authentify.entity.UserEntity;
import com.example.authentify.io.EvaluationRequest;
import com.example.authentify.io.UpdateEvaluationRequest;
//import com.example.authentify.io.ReponseRequest;
import com.example.authentify.repository.EvaluationRepository;
import com.example.authentify.service.PrincipeService;
import com.example.authentify.service.ProfileService;
import com.example.authentify.service.EvaluationServiceImp;

import java.util.ArrayList;
import java.util.HashMap;
//import java.util.Map;
import java.util.List;
//import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

//import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.Map;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.PutMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.ResponseStatus;
//import static java.util.Map.entry;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/v1.0/evaluation")
@RequiredArgsConstructor
public class EvaluationController {
    //private final EvaluationRepository evaluationRepository;
    private final EvaluationRepository evaluationRepository;
    //private final ReponseRepository reponseRepository;
    private final EvaluationServiceImp evaluationService;
    private final PrincipeService principeService;
    private final ProfileService organismeService;

   @PostMapping("/new")
    public ResponseEntity<Long> createEvaluation(@RequestBody EvaluationRequest request) {
        EvaluationEntity evaluation = evaluationService.createEvaluation(request);
        return ResponseEntity.ok(evaluation.getId());
    }

    @GetMapping("/principes")
    public ResponseEntity<List<PrincipeEntity>> getAllPrincipes() {
        List<PrincipeEntity> principes = principeService.getAllPrincipes();
        return ResponseEntity.ok(principes);
    }

    @PostMapping("/reponses/reponse/save/{evaluationId}")
    public ResponseEntity<?> saveReponse(
        @PathVariable Long evaluationId,
        @RequestParam Long critereId,
        @RequestParam Integer valeur,
        @RequestParam(required = false) MultipartFile[] files // optional file
    ) {
    try {
        ReponseEntity savedEvaluation = evaluationService.saveReponse(evaluationId, critereId, valeur, files);
        return ResponseEntity.ok(savedEvaluation);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
    }
}



    @GetMapping("/organisme/{organismeId}")
    public ResponseEntity<List<Map<String, Object>>> getEvaluationsByOrganisme(@PathVariable Long organismeId, @RequestParam(required = false) Integer annee){
        int year = (annee != null) ? annee : java.time.LocalDate.now().getYear();
        List<EvaluationEntity> evaluations = evaluationService.getEvaluationsByOrganismeByAnnee(organismeId, year);

        List<Map<String, Object>> response = evaluations.stream().map((EvaluationEntity ev) -> {
            //int preuvesCount = ev.getReponses() != null ? ev.getReponses().size() : 0;
            int preuvesCount = 0;
            if (ev.getReponses() != null) {
                preuvesCount = ev.getReponses().stream()
                .mapToInt(r -> r.getPreuves() != null ? r.getPreuves().size() : 0)
                .sum();
        }
            //calculer progress pour chaque evaluation
            int total = ev.getReponses() != null ? ev.getReponses().size() : 0;

            int evaluated = 0;
            if (ev.getReponses() != null) {
                evaluated = (int) ev.getReponses().stream()
                    .filter(r -> r.getStatut() != null &&
                        (r.getStatut().equals("validé") || r.getStatut().equals("refusé")))
                    .count();
            }
            int progress = total == 0 ? 0 : (int) ((evaluated * 100.0) / total);

            String statut = ev.getStatut();
            String dateCreation = ev.getDateSoumission() != null ? ev.getDateSoumission().toLocalDateTime().toLocalDate().toString() : "";
            String dateUpdate= ev.getDateUpdate() != null ? ev.getDateUpdate().toLocalDateTime().toLocalDate().toString() : "";
            //String organisme = "Organisme #" + ev.getId();
            Integer score=ev.getScore();
            int scoreMax = evaluationService.calculerMaxScore();
            String label=evaluationService.getLabel(score != null ? score : 0, scoreMax);
            ev.setLabel(label); // update label in the entity (optional, if you want to save it back to DB later)

            // Fetch organisme
            OrganismeEntity org = organismeService.getOrganismeById(ev.getOrganisme().getId());
            String organismeName = org != null ? org.getNomOrganisme() : "_";
            String responsableName = (org != null && org.getResponsable() != null) ? org.getResponsable().getNom() : "_";
            String ResponsableRole=(org != null && org.getResponsable() != null) ? org.getResponsable().getJobRole() : "_";

            Map<String, Object> map = new java.util.HashMap<>(); // create a mutable map to put values in
            map.put("id", ev.getId());
            map.put("organismeId", ev.getId());
            map.put("organismeName", organismeName);
            map.put("responsableName", responsableName);
            map.put("responsableRole", ResponsableRole);
            map.put("statut", statut);
            map.put("dateCreation", dateCreation);
            map.put("dateUpdate", dateUpdate);
            map.put("progress", progress);
            map.put("preuves", preuvesCount);
            map.put("score", score);
            map.put("scoreMax", scoreMax);
            map.put("label", label);
            return map;
        }).toList();

    return ResponseEntity.ok(response);
}

//////////////////////////////////////////////////////////////////////

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getEvaluationsByUser(@RequestParam Long userId){
        List<EvaluationEntity> evaluations = evaluationService.getEvaluationsByUserId(userId);

        List<Map<String, Object>> response = evaluations.stream().map((EvaluationEntity ev) -> {
            //int preuvesCount = ev.getReponses() != null ? ev.getReponses().size() : 0;
            int preuvesCount = 0;
            if (ev.getReponses() != null) {
                preuvesCount = ev.getReponses().stream()
                .mapToInt(r -> r.getPreuves() != null ? r.getPreuves().size() : 0)
                .sum();
        }
            List<Map<String, Object>> commentaires = new java.util.ArrayList<>();
            boolean hasComments = false;
            if (ev.getReponses() != null) {
                ev.getReponses().stream()
                    .filter(r -> r.getCommentaire() != null && !r.getCommentaire().isBlank())
                    .forEach(r -> {
                         // use principeService to get the critere name by id
                        String critereNom = "Critère #" + r.getCritereId(); // fallback
                        if (r.getCritereId() != null) {
                            try {
                                PrincipeEntity critere = principeService.getCritereById(r.getCritereId());
                                if (critere != null) critereNom = critere.getNom();
                            } catch (Exception ignored) {}
                        }

            Map<String, Object> c = new java.util.HashMap<>();
            c.put("critereNom", critereNom);
            c.put("commentaire", r.getCommentaire());
            c.put("statut", r.getStatut());
            commentaires.add(c);
        });
        hasComments = !commentaires.isEmpty();
}

            int progress = 0;
            if(ev.getReponses() != null && !ev.getReponses().isEmpty()) {
                int total = ev.getReponses().stream().mapToInt(r -> r.getValeur() != null ? r.getValeur() : 0).sum();
                int max = ev.getReponses().size() * 5; // max value per critere
                progress = (int)((double) total / max * 100);
            }

            String statut = ev.getStatut();
            String dateCreation = ev.getDateSoumission() != null ? ev.getDateSoumission().toLocalDateTime().toLocalDate().toString() : "";
            //String organisme = "Organisme #" + ev.getId();
            Integer score=ev.getScore();
            String label=ev.getLabel();

            // Fetch organisme
            OrganismeEntity org = organismeService.getOrganismeById(ev.getOrganisme().getId());
            String organismeName = org != null ? org.getNomOrganisme() : "_";
            String responsableName = (org != null && org.getResponsable() != null) ? org.getResponsable().getNom() : "_";

            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", ev.getId());
            map.put("organismeId", ev.getId());
            map.put("organismeName", organismeName);
            map.put("responsableName", responsableName);
            map.put("statut", statut);
            map.put("dateCreation", dateCreation);
            map.put("progress", progress);
            map.put("preuves", preuvesCount);
            map.put("score", score);
            map.put("label", label);
            map.put("hasComments", hasComments);
            map.put("commentaires", commentaires);
            return map;
        }).toList();

    return ResponseEntity.ok(response);
}


    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllEvaluations() {
        List<EvaluationEntity> evaluations = evaluationService.getAllEvaluations();
        List<Map<String, Object>> response = evaluations.stream().map(ev -> {

        int preuvesCount = 0;
        if (ev.getReponses() != null) {
            preuvesCount = ev.getReponses().stream()
                .mapToInt(r -> r.getPreuves() != null ? r.getPreuves().size() : 0)
                .sum();
        }

        int progress = 0;
        if (ev.getReponses() != null && !ev.getReponses().isEmpty()) {
            int total = ev.getReponses().stream()
                .mapToInt(r -> r.getValeur() != null ? r.getValeur() : 0)
                .sum();
            int max = ev.getReponses().size() * 5;
            progress = (int) ((double) total / max * 100);
        }

        OrganismeEntity org = organismeService.getOrganismeById(ev.getOrganisme().getId());

        return Map.<String, Object>of(
            "id", ev.getId(),
            "organismeId", org != null ? org.getId() : "_",
            "organismeName", org != null ? org.getNomOrganisme() : "_",
            "responsableName", (org != null && org.getResponsable() != null) ? org.getResponsable().getNom() : "_",
            "status", ev.getStatut(),
            "progress", progress,
            "preuves", preuvesCount
        );

    }).toList();

    return ResponseEntity.ok(response);
}


    @GetMapping("/{evaluationId}/reponses")
    public ResponseEntity<EvaluationEntity> getEvaluationResponses(@PathVariable Long evaluationId) {
        EvaluationEntity evaluation = evaluationService.getEvaluationByIdWithResponsesAndPreuves(evaluationId);
        if (evaluation == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(evaluation);
}

    @PutMapping("/reponses/{id}/enregistrer")
    public ResponseEntity<String> enregistrerComment(@PathVariable Long id,@RequestBody Map<String, String> body // receive the comment
    ) {
        String comment=body.get("comment");
        evaluationService.enregistrerComment(id,comment);
        return ResponseEntity.ok("reponse with id " + id + " has been validated.");
}

    @PutMapping("/reponses/{id}/valider")
    public ResponseEntity<String> validerCritere(@PathVariable Long id,
                                                @RequestBody Map<String, String> body // receive the comment
    ) {
        String comment=body.get("comment");
        evaluationService.validerReponse(id,comment);
        return ResponseEntity.ok("reponse with id " + id + " has been validated.");
}



    @PutMapping("/reponses/{id}/refuser")
    public ResponseEntity<String> refuserCritere(@PathVariable Long id,@RequestBody Map<String, String> body) {
        String comment=body.get("comment");
        
        evaluationService.refuserReponse(id,comment);
        return ResponseEntity.ok("reponse with id " + id + " has been refused.");
}

    @PutMapping("/{id}/updateStatut")
    public ResponseEntity<String> changerStatut(@PathVariable Long id,@RequestBody Map<String, String> body){
        String newStatut = body.get("statut");
        evaluationService.changerStatut(id, newStatut);
        return ResponseEntity.ok("statut with id " + id + " has been modified.");
}

    @DeleteMapping("{evaluationId}")
    public ResponseEntity<String> deleteEvaluation(@PathVariable Long evaluationId) {
        try{
        evaluationService.deleteEvaluation(evaluationId);
        return ResponseEntity.ok("Evaluation with id " + evaluationId + " has been deleted.");
    }
    catch (Exception e) {
        return ResponseEntity.status(500).body("Error occurred while deleting evaluation.");
    }
}

    @PutMapping("/{evaluationId}/score")
public ResponseEntity<String> setEvaluationScore(
        @PathVariable Long evaluationId,
        @RequestBody Map<String, Object> body) {

    Integer score = null;
    //Integer scoreMax = null;

    Object scoreObj = body.get("score");
    //Object scoreMaxObj = body.get("scoreMax");

    if (scoreObj instanceof Number) score = ((Number) scoreObj).intValue(); //handle numbers from a Map<String, Object>
    //if (scoreMaxObj instanceof Number) scoreMax = ((Number) scoreMaxObj).intValue(); // ← and this

    if (score == null) {
        return ResponseEntity.badRequest().body("Score is required");
    }

    evaluationService.setScoreForEvaluation(evaluationId, score);

    return ResponseEntity.ok("Score set successfully for evaluation " + evaluationId);
}


    @GetMapping("/all/treated")
    public ResponseEntity<List<Map<String, Object>>> getAllEvaluationsWithTreatedProgress() {
        List<EvaluationEntity> evaluations = evaluationService.getAllEvaluations();

    List<Map<String, Object>> response = evaluations.stream().map(ev -> {

        int totalCriteria = ev.getReponses() != null ? ev.getReponses().size() : 0;

        int treated = 0;
        if (ev.getReponses() != null) {
            treated = (int) ev.getReponses().stream()
                .filter(r -> "validé".equalsIgnoreCase(r.getStatut()) || "refusé".equalsIgnoreCase(r.getStatut())) //avec les boutons valider et refuser
                .count();
        }

        int progression = totalCriteria > 0 ? (int) ((double) treated / totalCriteria * 100) : 0;

        OrganismeEntity org = organismeService.getOrganismeById(ev.getOrganisme().getId());
        
        int maxScore = evaluationService.calculerMaxScore();
        int totalScore = ev.getScore() != null ? ev.getScore() : 0;

        String label = evaluationService.getLabel(totalScore, maxScore);
        String dateCreation = ev.getDateSoumission() != null ? ev.getDateSoumission().toLocalDateTime().toLocalDate().toString() : "";
        String dateUpdate= ev.getDateUpdate() != null ? ev.getDateUpdate().toLocalDateTime().toLocalDate().toString() : "";
        String dateTermination = ev.getDateTermination() != null ? ev.getDateTermination().toLocalDateTime().toLocalDate().toString() : "";

        // Build commentaires list from responses
        List<Map<String, Object>> commentaires = new ArrayList<>();
        if (ev.getReponses() != null) {
            for (ReponseEntity r : ev.getReponses()) {
                if (r.getCommentaire() != null && !r.getCommentaire().isBlank()) {
                    Map<String, Object> c = new java.util.HashMap<>();
                    c.put("commentaire", r.getCommentaire());
                    c.put("statut", r.getStatut());
                    c.put("critereId", r.getCritereId());
                    commentaires.add(c);
        }
    }
}

        // Use HashMap instead of Map.ofEntries
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", ev.getId());
        map.put("organismeId", org != null ? org.getId() : "_");
        map.put("organismeName", org != null ? org.getNomOrganisme() : "_");
        map.put("organismeType", org != null ? org.getType() : "_");
        map.put("organismeSecteur", org != null ? org.getSecteur() : "_");
        map.put("responsableName", (org != null && org.getResponsable() != null) ? org.getResponsable().getNom() : "_");
        map.put("responsableRole", (org != null && org.getResponsable() != null) ? org.getResponsable().getJobRole() : "_");
        map.put("status", ev.getStatut());
        map.put("progression", progression);
        map.put("totalCriteria", totalCriteria);
        map.put("treatedCriteria", treated);
        map.put("score", totalScore);
        //map.put("maxScore", maxScore);
        map.put("label", label);
        map.put("dateCreation", dateCreation);
        map.put("dateTermination", dateTermination);
        map.put("scoreMax", maxScore);
        map.put("logoUrl", org != null ? org.getLogoUrl() : "_");
        map.put("commentaires", commentaires);
        map.put("dateUpdate", dateUpdate);
        map.put("annee", ev.getAnnee());

        return map;

    }).toList();

    return ResponseEntity.ok(response);
}


    @GetMapping("/latest/{organismeId}")
    public ResponseEntity<EvaluationEntity> getLatestEval(@PathVariable Long organismeId){
        EvaluationEntity latest=evaluationService.getLatestEvaluation(organismeId);
        if (latest == null) {
            return ResponseEntity.ok().body(null);
        }
        return ResponseEntity.ok(latest);
    }

    @PutMapping("/update/{evaluationId}")
    public ResponseEntity<EvaluationEntity> updateEval(@PathVariable Long evaluationId,@RequestBody UpdateEvaluationRequest request){
        return ResponseEntity.ok(evaluationService.updateEvaluation(evaluationId, request));
    }

    @PutMapping("/updateLabel/{evaluationId}")
    public ResponseEntity<EvaluationEntity> updateLabel(@PathVariable Long evaluationId){
        return ResponseEntity.ok(evaluationService.updateLabel(evaluationId));
    }


    @GetMapping("/all/latest/treated")
    public ResponseEntity<List<Map<String, Object>>> getLatestTreatedPerOrganisme(@RequestParam(required = false) Integer annee) {
        int year = (annee != null) ? annee : java.time.LocalDate.now().getYear();
        List<EvaluationEntity> evaluations = evaluationService.getLatestTreatedPerOrganismeByAnnee(year);

    List<Map<String, Object>> response = evaluations.stream().map(ev -> {

        int totalCriteria = ev.getReponses() != null ? ev.getReponses().size() : 0;

        int treated = 0;
        if (ev.getReponses() != null) {
            treated = (int) ev.getReponses().stream()
                .filter(r -> "validé".equalsIgnoreCase(r.getStatut()) || "refusé".equalsIgnoreCase(r.getStatut())) //avec les boutons valider et refuser
                .count();
        }

        int progression = totalCriteria > 0 ? (int) ((double) treated / totalCriteria * 100) : 0;

        OrganismeEntity org = organismeService.getOrganismeById(ev.getOrganisme().getId());
        
        int maxScore = evaluationService.calculerMaxScore();
        int totalScore = ev.getScore() != null ? ev.getScore() : 0;

       
        String label = evaluationService.getLabel(totalScore, maxScore);
        String dateCreation = ev.getDateSoumission() != null ? ev.getDateSoumission().toLocalDateTime().toLocalDate().toString() : "";
        String dateTermination = ev.getDateTermination() != null ? ev.getDateTermination().toLocalDateTime().toLocalDate().toString() : "";
        String dateUpdate= ev.getDateUpdate() != null ? ev.getDateUpdate().toLocalDateTime().toLocalDate().toString() : "";

         // Build commentaires list from responses

        // Use HashMap instead of Map.ofEntries
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", ev.getId());
        map.put("organismeId", org != null ? org.getId() : "_");
        map.put("organismeName", org != null ? org.getNomOrganisme() : "_");
        map.put("organismeType", org != null ? org.getType() : "_");
        map.put("organismeSecteur", org != null ? org.getSecteur() : "_");
        map.put("responsableName", (org != null && org.getResponsable() != null) ? org.getResponsable().getNom() : "_");
        map.put("responsableRole", (org != null && org.getResponsable() != null) ? org.getResponsable().getJobRole() : "_");
        map.put("statut", ev.getStatut());
        map.put("progression", progression);
        map.put("totalCriteria", totalCriteria);
        map.put("treatedCriteria", treated);
        map.put("score", totalScore);
       // map.put("maxScore", maxScore);
        map.put("label", label);
        map.put("dateCreation", dateCreation);
        map.put("dateTermination", dateTermination);
        map.put("scoreMax", maxScore);
        map.put("logoUrl", org != null ? org.getLogoUrl() : "_");
        map.put("dateUpdate", dateUpdate);

        return map;

    }).toList();

    return ResponseEntity.ok(response);
}



@GetMapping("/rang/{organismeId}")
public ResponseEntity<List<Map<String, Object>>> getRangOrganisme(
        @PathVariable Long organismeId) {

    // Step 1 — get all years that have terminée evaluations
    List<Integer> annees = evaluationRepository.findDistinctAnnees();

    int globalMaxScore = evaluationService.calculerMaxScore();

    List<Map<String, Object>> result = new ArrayList<>();

    for (Integer year : annees) {

        // Step 2 — latest terminée per organisme for this year
            // get all terminée evals for this year, then pick the latest per organisme in Java
        List<EvaluationEntity> allTerminees = evaluationRepository.findAllTermineesByAnnee(year);
        Map<Long, EvaluationEntity> latestPerOrg = new HashMap<>();
        allTerminees.forEach(e -> {
            Long orgId = e.getOrganisme().getId();
            latestPerOrg.merge(orgId, e, (existing, incoming) ->
                incoming.getDateTermination() != null &&
                (existing.getDateTermination() == null || incoming.getDateTermination().after(existing.getDateTermination()))
                    ? incoming : existing
            );
        });
        //size() returns the numbers of keys in the map
        int totalOrganismes = latestPerOrg.size();

        // Step 3 — check if this organisme participated this year
        EvaluationEntity myEval = latestPerOrg.get(organismeId);
        if (myEval == null) continue; // organisme had no terminée eval this year — skip

        // Step 4 — compute score% for this organisme
        double myPct = myEval.getScore() != null ? (double) myEval.getScore() / globalMaxScore * 100 : 0;

        // Step 5 — dense rank: count distinct scores strictly higher than mine
        long higherCount = latestPerOrg.values().stream()
            .mapToDouble(e -> e.getScore() != null
                ? (double) e.getScore() / globalMaxScore * 100 : 0)
            .distinct()
            .filter(pct -> pct > myPct)
            .count();

        int rang = (int) higherCount + 1;

        Map<String, Object> row = new HashMap<>();
        row.put("annee", year);
        row.put("rang", rang);
        row.put("totalOrganismes", totalOrganismes);
        row.put("score", myEval.getScore());
        row.put("scoreMax", globalMaxScore);
        row.put("scorePct", Math.round(myPct));
        row.put("label", evaluationService.getLabel(
            myEval.getScore() != null ? myEval.getScore() : 0, globalMaxScore));

        result.add(row);
    }

    // Sort by year descending so frontend gets newest first
    result.sort((a, b) -> Integer.compare((int) b.get("annee"), (int) a.get("annee")));

    return ResponseEntity.ok(result);
}

    


}