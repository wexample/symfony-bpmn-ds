# BPMN : l'interface (-ds) et la démo (-demo)

Opened: 2026-10-09
Closed: 2026-10-09
Author: agent:main
For: agent design system

Une seule todo pour deux packages vides à ce jour : `symfony-bpmn-ds` (l'interface)
et `symfony-bpmn-demo` (la démo). Le backend (`php-bpmn`, `symfony-bpmn`) est fait,
testé et documenté. Le contexte complet (besoin, décisions, cas réels, sources) est
dans `symfony-bpmn/.wex/journal/todo/bpmn-model-and-tools.md` : à lire d'abord.

## Le besoin, en une phrase

Montrer à un client les règles d'une plateforme à plusieurs acteurs : qui fait quoi
(couloirs = acteurs), ce qu'une action déclenche (messages = notifications, timers =
« avant la date X »), les choix (passerelles), et dérouler un scénario pas à pas.
Pas de bpmn-js : un outil maison, construit sur le design system et qui l'enrichit.

## Ce qui existe déjà (backend)

### php-bpmn (sans framework, 26 tests)

- **Modèle** (`src/Class/Element/`) : `Definitions` → `Process` (nœuds, flux,
  couloirs imbriqués `Lane`), `Task` (enum `TaskType` : user, manual, service, send,
  receive, script, business rule), `Event` (`EventPosition` début / intermédiaire /
  frontière / fin ; `EventDefinition` message, timer, signal, error, terminate…),
  `Gateway` (`GatewayType` exclusive, parallel, inclusive, event-based),
  `SequenceFlow` (condition, par défaut), `SubProcess`, `CallActivity`,
  `Collaboration` / `Participant` / `MessageFlow`.
  Propriétés à nous dans `extensionElements` (`wex:property`), lues par
  `AbstractElement` : rôle ou grant d'un couloir, catégorie de notification d'un
  message.
- **XML** (`src/Class/Xml/`) : `BpmnXmlReader` / `BpmnXmlWriter`, BPMN 2.0 standard
  (le format qu'exportent bpmn.io, Camunda, Signavio ; aucune connexion à ces
  outils). Aller-retour sans perte : le diagramme et ce qu'on ne modélise pas sont
  conservés.
- **Diagramme** (`src/Class/Diagram/`) : `Diagram::getShape(id)` → `Bounds`
  (x, y, largeur, hauteur), `getEdge(id)` → points, `isEmpty()`.
  **Les cinq exemples n'ont pas de BPMNDI** (écrits par le builder) : l'affichage
  doit savoir calculer une mise en page (voir plus bas).
- **Builder** (`ProcessBuilder`) : `from`, `connectTo`, `connect`, `boundaryTimer`,
  `property`… pour écrire un processus en PHP.
- **Validateur** (`BpmnValidator` → `ValidationReport` de `ValidationIssue`,
  `IssueSeverity`) : structure, puis sous-ensemble exécutable. Ce qui est dessiné
  mais non exécuté y est signalé : à afficher tel quel.
- **Chemins** (`PathFinder::find()` → `Path` de `PathStep`) : chaque chemin d'un
  processus, chaque choix étiqueté (condition, `default`, `completed`, ou l'id d'un
  événement de frontière). C'est la matière du « parcours d'un chemin ».
- **Exemples** (`examples/*.bpmn`, anonymisés, sources dans
  `tests/Fixtures/ExampleProcesses.php`, régénérés avec `BPMN_WRITE_EXAMPLES=1`) :
  - `tenant-move-in` : entrée d'un locataire (bail, acompte, garantie, état des lieux) ;
  - `maintenance-request` : intervention, devis > 200 € soumis au propriétaire ;
  - `visit-booking` : réservation de visite, rappels J-1 / H-1 ;
  - `engagement-letter` : lettre de mission, signatures manager → associé → client,
    renouvellement à 1 ou 3 ans selon le risque, relance ;
  - `article-review` : relecture d'article (inventé), sur les équipes de user-demo.

### symfony-bpmn (17 tests)

- **Configuration** `wexample_symfony_bpmn` : `paths` (dossiers de `.bpmn`), `lanes`
  (`<process>.<lane>: {role | grant}`).
- **`BpmnRegistry`** : `all()`, `get(id)` → `Process`, `getDefinitions(id)`,
  `getFile(id)`, `compile(id)`, `validate(id)` → `ValidationReport`, `register()`.
- **Exécution** : chaque processus compilé (`ProcessCompiler`) en Symfony Workflow,
  réseau de Petri, nommé `bpmn.<id>`, marquage stocké sur le sujet
  (`BpmnSubjectInterface` + `Entity/Traits/HasBpmnStateTrait`).
  `BpmnRunner` : `start`, `complete(subject, nodeId, variables)`, `receive(message)`,
  `fireTimer`, `getAvailableNodes(subject)` (ce que l'utilisateur courant peut
  faire), `getWaitingNodes`, `isFinished`. Tâches automatiques via
  `BpmnTaskHandlerInterface`, timers via Messenger, conditions en ExpressionLanguage.
- **Droits** : `LaneAccessService::mayAct()` (couloir → rôle, ou grant de membership
  symfony-user sur le groupe du sujet, `BpmnGroupSubjectInterface`) ;
  `BpmnGuardSubscriber` bloque les transitions.
- **Matrice** `BpmnMatrixService::build(id)` : une ligne par tâche (`task`, `name`,
  `type`, `lane`, `lane_name`, `role`, `grant`, `automatic`, `interrupted_by`).
  Prête pour un `data_table`.
- **Scénarios** `BpmnScenarioService` : `getPaths(id)` et `play(subject, path, actAs)`
  qui joue un chemin en changeant d'acteur à chaque couloir.
- **Branchements optionnels** : symfony-activity (historique, catégorie `bpmn`),
  symfony-notification (messages notifiés, destinataires via
  `BpmnRecipientResolverInterface`). Événements `BpmnTransitionEvent`,
  `BpmnMessageEvent`.
- **Commandes** : `bpmn:list`, `bpmn:validate`, `bpmn:paths`, `bpmn:matrix`,
  `bpmn:dump` (Mermaid).

Hors périmètre exécuté, volontairement (dessiné, signalé par le validateur) : flux
interne des sous-processus et call activities (une seule étape), frontières non
interrompantes, passerelles inclusive / complex, erreurs, compensation.

## À faire : symfony-bpmn-ds

Sur les composants du design system uniquement (pas de HTML brut ni de CSS
propre ; voir `symfony-design-system/.wex/journal/todo/component-schemas.md`).
Ordre proposé :

1. **Affichage du diagramme (lecture seule)** : couloirs, tâches typées,
   événements, passerelles, flux avec leurs conditions. Utiliser le BPMNDI quand il
   existe ; sinon **mise en page automatique** (couloirs en bandes, nœuds en rangs
   selon l'ordre des flux). À décider : calcul côté PHP (puis écrit en BPMNDI,
   réutilisable) ou côté front.
2. **Fiche d'un processus** : diagramme, matrice des droits (`data_table`), rapport
   de validation (`message_*`), liste des chemins.
3. **Parcours d'un chemin** (« user story à tiroirs ») : les étapes d'un `Path`,
   l'acteur de chaque étape, les choix pris, surlignés sur le diagramme.
4. **Instance en cours** (pour un sujet) : où il en est (`getWaitingNodes`), ce que
   l'utilisateur courant peut faire (`getAvailableNodes` → boutons d'action),
   historique (activity).
5. **Édition** ensuite, quand l'affichage est validé avec le propriétaire.

## À faire : symfony-bpmn-demo

- Une démo à elle, **sans utilisateurs propres** : comptes et équipes de
  symfony-user-demo (équipes Editorial, où demo est administrateur, et Studio, où il
  est observateur), comme notification-demo et signature-demo.
- Les cinq exemples de php-bpmn enregistrés dans le registre ; `article-review`
  branché pour de vrai : couloirs sur les grants des équipes, notifications via
  symfony-notification, un sujet démo qu'on fait avancer.
- **Rédigée en anglais** : `.trans.yml` avec `en:` seulement, les autres langues
  viennent de l'outil de traduction.
- Installation dans MOJOE design system (`composer.json`, bundles, menu, migration
  pour le marquage du sujet démo) : rien n'y est encore installé pour BPMN.

## Clos le 2026-10-09

Interface et démo faites par l'agent design system, confirmé par le propriétaire.
