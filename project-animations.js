const picker=document.querySelector('[data-project-picker]');
if(picker){
  picker.innerHTML=projects.map((p,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${p[0]}</option>`).join('');
  const nodeSets={operations:['Operator','Workflow API','Task queue','Processor','Records'],workflow:['Participant','Workflow API','Notification queue','Workflow worker','Case status'],platform:['Service','Shared API','Event bus','Platform worker','Shared store'],modernization:['User','Modern web app','Integration bridge','Background sync','Legacy + new data']};
  const slots=['client','api','queue','worker','data'];
  function applyProject(){const project=projects[Number(picker.value)],nodes=nodeSets[project[2]]||nodeSets.operations;slots.forEach((slot,i)=>{const target=document.querySelector(`[data-node-${slot}]`);if(target)target.textContent=nodes[i]});const title=document.querySelector('[data-step-title]');if(title)title.textContent=`${project[0]} · ${steps[current][1]}`}
  picker.addEventListener('change',()=>{current=0;renderStep();applyProject()});
  const cycle=setInterval;const oldNext=nextStep;nextStep=()=>{oldNext();applyProject()};applyProject();
}
