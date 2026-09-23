export const preparationChecks=['content','takes','picture','pauses','pace','audioLevels','color','decode'];
export const defectClasses={
 interval:['restart','mouth-preparation','blink-reset','literal-repeat','semantic-repeat','long-pause','word-timing-anomaly'],
 join:['clipped-onset','clipped-tail','long-pause','restart','semantic-repeat','picture-jump'],
};
export const pendingClasses=kind=>Object.fromEntries(defectClasses[kind].map(k=>[k,'pending']));
