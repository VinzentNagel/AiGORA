# Gender Bias

## 1. Core Definition
Gender bias in educational materials extends far beyond the simple counting of male vs. female pronouns. It encompasses the systematic asymmetry in how different genders are assigned agency, cognitive authority, and societal roles. It manifests through occupational stereotyping, the linguistic coding of action versus passivity, and the use of language that renders specific genders invisible as the "default" human.

## 2. Scientific Markers (What the AI Scans For)
* **Verb Asymmetry (Active vs. Passive):** Research across 1,255 textbooks from 34 countries statistically proves that male characters are disproportionately assigned active, decision-making verbs (e.g., "ruled," "decided," "invented"), while female characters are assigned passive, supportive, or emotive verbs (e.g., "waited," "helped," "felt").
* **Spatial & Occupational Embedding:** NLP analysis of textbooks demonstrates that male entities are structurally embedded near words associated with "achievement," "power," and "work," while female entities are embedded near words related to "home," "domesticity," and "chores". 
* **The Generic Masculine:** The use of terms like "mankind," "policeman," or the universal "he" to describe generic humanity or professions, which linguistically codes the male as the universal default and marginalizes other identities.

## 3. Pedagogical Impact (The Hidden Curriculum)
Through constant exposure to these asymmetric representations, students internalize a "hidden curriculum" that dictates acceptable societal roles. This restricts the academic and occupational aspirations of marginalized genders, particularly steering them away from STEM and leadership fields.

## 4. FALSE POSITIVE CHECK (What this is NOT)
To maintain scientific neutrality, the AI must explicitly exclude the following scenarios from being flagged as a bias:
* **Isolated Traditional Roles:** A text is NOT biased simply because a woman is depicted as a mother, or a man is depicted as a mechanic. Traditional roles are not inherently biased. The bias ONLY exists if the text presents these roles as the *only* valid options, or if there is a severe mathematical asymmetry (e.g., *only* men get active verbs across the entirety of the text).
* **Historical Primary Sources:** Do not flag historically accurate primary source quotes (e.g., a 19th-century historical document using the word "mankind") as a structural bias of the *modern textbook author*, unless the modern textbook completely fails to contextualize it.
* **Contextually Relevant Explicit Marking:** Explicitly marking sex or gender (e.g., "Marie Curie was a female scientist") is not a bias if the historical context makes her gender relevant to the narrative of overcoming institutional barriers.

## 5. SEVERITY SCALE DEFINITIONS:
Evaluate the finding against this universal pedagogical scale.

- Level 1 (Lexical/Surface): Subtle use of outdated terminology or isolated micro-aggressions. 
  *Eurocentrism Example:* Using the term "Third World" instead of "Global South," or a single exoticizing adjective.

- Level 2 (Structural/Hidden Curriculum): Bias woven into the narrative structure or rigid assumptions. Requires pedagogical intervention.
  *Eurocentrism Example:* A teleological narrative that frames a non-Western country as simply "catching up" to Western industrialization, or centering European actors in a global event.

- Level 3 (Exclusionary/Erasure): Active hierarchization of human value or complete epistemic erasure of a group's agency.
  *Eurocentrism Example:* "White Savior" narratives that justify colonization, or claiming an inhabited continent was "discovered" (completely erasing indigenous existence).