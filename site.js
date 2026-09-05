const projects=[
['Multi-tenant ERP operations, ordering & reporting platform','Business operations moving from legacy desktop workflows to independently scalable web services','modernization'],
['Public intake, case management & document workflow','Intake, scheduling, documents, notifications, and staff case review','workflow'],
['Commercial printing, quoting & production management suite','Customer ordering, catalog, quoting, document preparation, and production work','operations'],
['Mobile inventory counting & replenishment platform','Counting, ordering, mobile use, tenant-aware stores, reports, and labels','operations'],
['Modular multi-tenant operations SaaS platform','A composed web product with identity, reporting, background jobs, and messaging','platform'],
['Regional public-service intake & case routing portal','Validated submissions, regional assignment, document storage, and staff review','workflow'],
['Event-sourced service ticket & field task platform','Tickets, tasks, mobile actions, recurring work, projections, and messaging','workflow'],
['Mobile field time, notes & ticket companion','A mobile container coordinating time entry, field notes, and service tasks','operations'],
['Customer journey, interaction & messaging workspace','Interaction history, customer events, working views, notes, and messages','workflow'],
['Policy-gated infrastructure deployment console','Risk-checked cluster, database, host, and ticket automation with audit records','platform'],
['Read-only event-store timeline & diagnostics explorer','Support-oriented operational history reconstructed without changing source events','platform'],
['Mobile client progress, documents & messaging portal','Secure service progress, documents, and communication for mobile clients','workflow'],
['Browser-based high-volume receivables entry tool','Responsive browser data entry with local processing and background synchronization','operations'],
['Batch label generation & print operations workflow','Batch-oriented label preparation, reporting, and production output','operations'],
['Browser-based financial calculation & reporting workspace','Modern calculation, validation, scenario, and report workflows','modernization'],
['Airport reservation, billing & operations platform','Event-driven reservations, operational work, invoices, and reporting','operations'],
['Desktop warehouse inventory, invoicing & reporting system','Warehouse desktop operations, web services, inventory data, invoices, and reports','operations'],
['Dealer lead distribution & referral reporting platform','Lead intake, dealer assignment, referral progression, and reporting','workflow'],
['Role-aware client product & service portal modernization','A modernized web portal with access-aware product and service workflows','modernization'],
['Desktop data cleansing, conversion & export toolkit','Focused tools for conversion, data cleanup, validation, and export','operations'],
['Configurable records, forms & workflow engine','Reusable form definitions, record queries, writes, and workflow hooks','platform'],
['CQRS event workflow, projections & audit foundation','Commands, events, read models, process coordination, and history','platform'],
['Shared service hosting, security & caching foundation','Configuration, authentication, caching, startup, and shared service behavior','platform'],
['Reusable enterprise forms, grids & dialog UI system','Consistent forms, grids, validation, dialogs, and application components','platform'],
['Shared web session, validation & hosting utilities','Reusable session, validation, host startup, and web application behavior','platform'],
['Message-driven workflow, compensation & monitoring service','Asynchronous processing, compensating actions, retries, and operational monitoring','platform'],
['Full-text search, filtering & index management capability','Search queries, filtering, indexing, and operational index management','platform'],
['Event-driven email & SMS communication service','Queued email and SMS delivery with templates, provider handling, and status','platform'],
['Identity-verified document review & approval workflow','Verification, secure review, signing, lifecycle history, and notifications','workflow'],
['Template-driven document generation & scheduling service','Template editing, data merge, storage, and scheduled document output','workflow'],
['OIDC sign-in, token validation & access client library','Reusable login, session, token validation, policy, and protected API behavior','platform'],
['Identity administration & self-service component suite','User, role, device, profile, recovery, and administration interfaces','platform'],
['Multi-tenant branded identity & realm deployment','Tenant discovery, branded sign-in, identity extensions, and application sessions','platform'],
['User, device & legacy authentication gateway services','Modern user and device sign-in with isolated legacy migration paths','platform'],
['Tenant provisioning, configuration & data-assignment service','Tenant setup across configuration, data stores, secrets, identity, and status','platform'],
['Provider-neutral secrets & vault access abstraction','One application contract for authenticated access to secure vault providers','platform'],
['Multi-provider repository & query data access layer','Repository and query contracts across SQL Server, MySQL, and embedded stores','platform'],
['Tenant-scoped sequence & code generation service','Transactional sequence reservation and generated codes across storage providers','platform'],
['Template-driven bulk data import & status pipeline','File upload, template matching, transformation jobs, bulk loading, and progress','workflow'],
['Shared contracts, errors, logging & helper kernel','A dependency-light kernel used across APIs, web applications, mobile, and infrastructure','platform'],
['Structured logging, indexing & diagnostic search utilities','Normalized application logs, structured adapters, indexes, and operator search','platform'],
['Blazor XML tree & detail inspection component','Safe XML parsing with navigable hierarchy and selected-element detail views','platform']
];

const year=document.querySelector('[data-year]');
if(year)year.textContent=new Date().getFullYear();

function initNavigation(){
  const nav=document.querySelector('.nav-in');
  const links=nav?.querySelector('.links');
  if(!nav||!links)return;
  links.id=links.id||'site-nav';
  if(!nav.querySelector('.menu-toggle')){
    const button=document.createElement('button');
    button.className='menu-toggle';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',links.id);button.setAttribute('aria-label','Open navigation');
    button.innerHTML='<span></span><span></span><span></span>';
    nav.insertBefore(button,links);
    const close=()=>{links.classList.remove('is-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation')};
    button.addEventListener('click',()=>{const open=links.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
    links.addEventListener('click',event=>{if(event.target.closest('a'))close()});
    addEventListener('keydown',event=>{if(event.key==='Escape')close()});
    addEventListener('resize',()=>{if(innerWidth>860)close()},{passive:true});
  }
}
initNavigation();

const projectRow=(project,index)=>`<a class="project-row" data-project="${project[2]}" href="architecture.html?project=${encodeURIComponent(project[0])}" aria-label="Open architecture for ${project[0]}"><span class="project-id">${String(index+1).padStart(2,'0')}</span><span><strong class="project-title">${project[0]}</strong><span class="project-description">${project[1]}</span></span><span class="project-kind">${project[2]}</span><span class="project-arrow" aria-hidden="true">↗</span></a>`;
const featuredProject=(project,index)=>`<a class="featured-project" href="architecture.html?project=${encodeURIComponent(project[0])}" aria-label="Open architecture for ${project[0]}"><p class="kicker">System ${String(index+1).padStart(2,'0')} · ${project[2]}</p><h3>${project[0]}</h3><p>${project[1]}</p><span class="project-open">Explore the system ↗</span></a>`;
const grid=document.querySelector('[data-project-grid]');
if(grid)grid.innerHTML=projects.map((project,index)=>projectRow(project,index)).join('');
const featuredGrid=document.querySelector('[data-featured-project-grid]');
if(featuredGrid){const featured=[0,6,15];featuredGrid.innerHTML=featured.map(index=>featuredProject(projects[index],index)).join('')}

document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(item=>item.classList.remove('active'));button.classList.add('active');const type=button.dataset.filter;document.querySelectorAll('[data-project]').forEach(item=>item.hidden=type!=='all'&&item.dataset.project!==type)}));
