/* TiTaN dashboard: bindings for the existing API and bilingual UI. */
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const tr = (key, vars) => I18N.t(key, vars);
  function uiText(key, vars) {
    const values = vars ? ` data-i18n-vars="${esc(JSON.stringify(vars))}"` : '';
    return `<span data-i18n="${key}"${values}>${esc(tr(key, vars))}</span>`;
  }
  function setText(element, key, vars){
    if(!element)return;
    element.setAttribute('data-i18n',key);
    if(vars) element.setAttribute('data-i18n-vars',JSON.stringify(vars));
    element.textContent=tr(key,vars);
  }
  function dateLabel(value){
    const ts=Number(value);
    if(!ts)return uiText('never');
    return `<time data-date-ts="${ts}">${esc(new Date(ts*1000).toLocaleString(I18N.locale,{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}))}</time>`;
  }
  function errorText(value) {
    const message = String(value || '');
    const translatedKey = I18N.keyFor(message);
    if (translatedKey) return tr(translatedKey);
    const key = ERROR_KEYS[message];
    if (key) return tr(key);
    const http = message.match(/HTTP (\d{3})/);
    if (http) return tr('http_error', {status: http[1]});
    if (message.startsWith('invalid-')) return tr('invalid_value');
    if (message === 'too-large') return tr('file_too_large');
    return message ? tr('operation_failed') : tr('unknown');
  }
  function routeWarning(message){
    const patterns=[
      [/^(.*): the node is disabled \(maintenance\) — the config is served by the panel$/, 'route_node_disabled',['node']],
      [/^(.*): the node has no sync token, so it never received its users — the config is served by the panel$/, 'route_node_no_credential',['node']],
      [/^(.*): no successful sync to this node yet — the config is served by the panel$/, 'route_node_never_synced',['node']],
      [/^(.*): the last sync to this node failed, so it does not have this user — the config is served by the panel$/, 'route_node_sync_failed',['node']],
      [/^(.*): the node has not been synced recently — the config is served by the panel$/, 'route_node_sync_stale',['node']],
      [/^(.*): this user was not part of the last successful sync to this node — the config is served by the panel$/, 'route_user_not_synced',['node']],
      [/^(.*): (.*?) — the raw port is not reachable on this node, so the link uses its HTTPS edge instead \(XHTTP\/TLS\)\.$/, 'route_raw_node',['node','reason']],
      [/^(.*): no usable TLS edge either \((.*)\); the config is served by the panel\.$/, 'route_no_tls_edge',['node','host']],
      [/^(.*): its edge answers over plain http, so a TLS link cannot complete — put TLS in front of the node or use a raw transport there\.$/, 'route_plain_http',['node']],
      [/^(.*): the address is an IP literal, so a TLS certificate has no name to match — use the node's domain\.$/, 'route_ip_certificate',['node']],
      [/^the platform TCP proxy \((.*?)\) forwards to container port (.*?), but this config needs port (.*?): the link goes over the HTTPS edge instead \((.*?)\), which always connects\. Move the TCP proxy to .* to keep it raw\.$/, 'route_proxy_mismatch',['proxy','actual','wanted','transport']],
      [/^(.*?) is unreachable through the HTTP edge; the link was mapped to (.*?) on the edge port so it can actually connect \(the stored config is unchanged\)\.$/, 'route_edge_mapping',['stored','mapped']],
    ];
    for(const [pattern,key,names] of patterns){
      const match=String(message).match(pattern);
      if(match)return uiText(key,Object.fromEntries(names.map((name,index)=>[name,match[index+1]==='unknown'||match[index+1]==='no address'?'—':match[index+1]])));
    }
    return uiText('route_review');
  }
  const ERROR_KEYS = {
    "name-required": "error_name_required",
    "address-required": "error_address_required",
    "no-configs-selected": "error_no_configs_selected",
    "no-credential": "error_no_credential",
    "bad-secret": "error_bad_secret",
    "bad-token": "error_bad_token",
    "wrong-old-password": "error_wrong_old_password",
    "weak-password": "error_weak_password",
    "unauthorized": "error_unauthorized",
    "not-found": "error_not_found",
    "node-already-claimed": "error_node_already_claimed",
    "not-a-titan-node": "error_not_a_titan_node",
    "invalid-backup": "error_invalid_backup",
    "invalid-image": "error_invalid_image",
    "invalid-avatar": "error_invalid_avatar",
    "no-file": "error_no_file",
    "no-address-or-credential": "error_no_address_or_credential",
    "invalid-quota": "error_invalid_quota",
    "invalid-expire": "error_invalid_expire",
    "invalid-limit": "error_invalid_limit",
    "invalid-allowed_ips": "error_invalid_allowed_ips",
    "invalid-protocol": "error_invalid_protocol",
    "unknown-transport": "error_unknown_transport",
    "ConnectError": "error_ConnectError",
    "ConnectTimeout": "error_ConnectTimeout",
    "ReadTimeout": "error_ReadTimeout",
    "sync-failed": "error_sync_failed",
    "unreachable": "error_unreachable",
    "disabled": "error_disabled",
    "no-address": "error_no_address"
};

  function fmtBytes(b){ b=Number(b)||0; if(b===0) return '0 B'; const u=['B','KB','MB','GB','TB']; let i=0; while(b>=1024&&i<u.length-1){b/=1024;i++;} return (i===0?b:b.toFixed(b>=10?1:2).replace(/\.0+$/,''))+' '+u[i]; }
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }
  const flagFor = code => TiTaNFlags.emoji(code);
  const nodeFlag = node => TiTaNFlags.html(node, I18N.lang);
  const nodeName = node => node && node.is_local && node.name === 'سرور اصلی' ? tr('main_node') : (node && node.name || tr('node'));
  const nodeNameLabel = node => node && node.is_local && node.name==='سرور اصلی' ? uiText('main_node') : esc(nodeName(node));
  const nodePlace = node => TiTaNFlags.countryName(node, I18N.lang);
  const placeLabel = node => `<span data-country-name="${TiTaNFlags.code(node)}">${esc(nodePlace(node))}</span>`;

  const ICONS = {
    bolt:'<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z"/>',
    sparkle:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M18.5 15.5l.7 1.9 1.8.6-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.6.7-1.9z"/>',
    userplus:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.7-3.6 3-5.7 6-5.7s5.3 2.1 6 5.7"/><path d="M18 8v6M15 11h6"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    edit:'<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
    copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 18h3"/>',
    eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    pulse:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    sync:'<path d="M21 12a9 9 0 0 1-15.3 6.4M3 12a9 9 0 0 1 15.3-6.4"/><path d="M21 4v6h-6M3 20v-6h6"/>',
    power:'<path d="M18.4 6.6a9 9 0 1 1-12.8 0"/><path d="M12 2v10"/>',
    download:'<path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5"/><path d="M4 19h16"/>',
    sliders:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>',
    checks:'<path d="M3 7.5 6 10.5l4.5-5M12 8h9M3 17.5 6 20.5l4.5-5M12 18h9"/>',
    xcircle:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2.6"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="M4.2 17.6 9.4 12l3.9 3.7 2.9-2.5 3.5 3.3"/>',
  };
  function icon(name, size=17, width=1.8){
    const body = ICONS[name] || ICONS.sparkle;
    return `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:${width};stroke-linecap:round;stroke-linejoin:round" aria-hidden="true">${body}</svg>`;
  }

  function icoBtn(attrs, name, tip, variant=''){
    const tipKey = I18N.keyFor(tip);
    const a = Object.entries(attrs||{}).map(([k,v])=>`${k}="${esc(v)}"`).join(' ');
    return `<button class="ico-btn${variant?' '+variant:''}" data-tip="${esc(tip)}" data-i18n-tip="${tipKey}" aria-label="${esc(tip)}" ${a}>${icon(name)}</button>`;
  }

  async function apiJson(url, opts={}){
    opts.credentials='same-origin';
    opts.headers=Object.assign({'Content-Type':'application/json'},opts.headers||{});
    try{
      const tok=localStorage.getItem('titan_token');
      if(tok && !opts.headers['Authorization']) opts.headers['Authorization']='Bearer '+tok;
    }catch(_){}
    if(opts.body&&typeof opts.body!=='string') opts.body=JSON.stringify(opts.body);
    const r=await fetch(url,opts);
    let d={}; try{d=await r.json();}catch(e){ if(!r.ok) throw new Error(r.statusText); }
    if(!r.ok) throw new Error(d.detail||d.message||r.statusText);
    return d;
  }

  let toastEl=$('#titanToast');
  if(!toastEl){ toastEl=document.createElement('div'); toastEl.id='titanToast'; toastEl.style.cssText='position:fixed;left:50%;bottom:22px;transform:translate(-50%,14px);opacity:0;pointer-events:none;padding:10px 16px;border-radius:12px;color:#eeeaff;background:rgba(6,8,35,.94);border:1px solid rgba(104,77,255,.45);box-shadow:0 0 24px rgba(75,40,255,.18);backdrop-filter:blur(12px);transition:.24s;z-index:9999;font-size:12px;'; document.body.appendChild(toastEl); }
  function toast(m){ toastEl.textContent=m; toastEl.style.opacity='1'; toastEl.style.transform='translate(-50%,0)'; clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>{toastEl.style.opacity='0';toastEl.style.transform='translate(-50%,14px)';},2200); }

  const EDGE_POPS = {sjc1:"pop_sjc", iad1:"pop_iad", ams1:"pop_ams",
                     fra1:"pop_fra", lon1:"pop_lon", sin1:"pop_sin",
                     bom1:"pop_bom", dxb1:"pop_dxb", cdg1:"pop_cdg"};
  function latBand(ms){
    if(ms==null) return ['off','—'];
    if(ms<70)  return ['ok',tr("lat_low")];
    if(ms<120) return ['ok',tr("lat_good")];
    if(ms<180) return ['mid',tr("lat_moderate")];
    return ['bad',tr("lat_high")];
  }
  function latCb(url){ return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cb=' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function latNow(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }
  async function rttOnce(url, mode, timeout){
    const ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = ctl ? setTimeout(()=>{ try{ ctl.abort(); }catch(e){} }, timeout||4000) : null;
    const t0 = latNow();
    try{
      await fetch(latCb(url), {cache:'no-store', mode: mode||'cors', credentials:'omit',
                               signal: ctl?ctl.signal:undefined, redirect:'follow'});
      return Math.max(1, Math.round(latNow() - t0));
    }catch(e){ return null; }
    finally{ if(timer) clearTimeout(timer); }
  }
  // The first request pays DNS + TLS, the rest reuse the connection: only the
  // later samples describe the link itself, so they are what gets reported.
  async function rttBest(url, mode, samples){
    const n = samples||3; let best=null, sum=0, cnt=0;
    for(let i=0; i<=n; i++){
      const ms = await rttOnce(url, mode, 4000);
      if(ms==null) continue;
      if(i>0){ best = (best==null||ms<best)? ms : best; sum+=ms; cnt++; }
    }
    return cnt ? {ms:best, avg:Math.round(sum/cnt), n:cnt} : null;
  }

  async function openLatencyAdvisor(){
    const nodesRes = await apiJson('/api/nodes').catch(()=>({nodes:[]}));
    const nodes = (nodesRes.nodes||[]).filter(n=>n.enabled!==false);
    const rows = [];
    const add=(key,name,url,mode,extra)=> rows.push(Object.assign({key:key,name:name,url:url||'',mode:mode||'cors',result:null}, extra||{}));

    add('panel',tr("current_panel"),'/healthz','same-origin',{nameKey:'current_panel',hintKey:'panel_route_hint'});
    nodes.forEach(n=>{
      const addr = String(n.address||'').replace(/\/+$/,'');
      const label = nodeName(n);
      if(!addr){ add('n'+n.id, label, '', 'cors', {skip:'no_address',place:n}); return; }
      if(addr.indexOf('http://')===0){ add('n'+n.id, label, '', 'cors', {skip:'http_probe_skip',place:n}); return; }
      const base = addr.indexOf('http')===0 ? addr : 'https://'+addr;
      add('n'+n.id, label+tr("node_suffix"), base+'/healthz', 'no-cors', {node:true, place:n});
    });
    add('cf',tr("nearest_cf"),'https://cp.cloudflare.com/generate_204','no-cors',{nameKey:'nearest_cf',hintKey:'reference_latency_hint'});

    const displayName=r=>r.nameKey?tr(r.nameKey):(r.place?nodeName(r.place):r.name);
    const rowHtml=(r)=>{
      const b = latBand(r.result && r.result.ms);
      const val = r.skip ? '<span class="muted">—</span>'
                : (r.result ? `<b class="lat-ms ${b[0]}">${r.result.ms}</b> <span class="muted">ms</span>`
                             : '<span class="lat-spin">…</span>');
      return `<div class="lat-row" id="lat-${esc(r.key)}"><span class="lat-name"${r.hintKey?' data-tip="'+esc(tr(r.hintKey))+'"':''}>${r.place?nodeFlag(r.place):''}${esc(displayName(r))}</span>`
           + `<span class="lat-val">${val}</span><span class="lat-tag pill ${b[0]}">${esc(r.skip?tr(r.skip):b[1])}</span></div>`;
    };

    const body = `<div style="display:grid;gap:12px">
      <p style="margin:0;font-size:11.5px;color:#a8a6bf;line-height:2">
        ${uiText("ping_intro")} <b>${uiText("this_device")}</b> ${uiText("ping_intro_tail")}
      </p>
      <div class="lat-grid" id="latGrid">${rows.map(rowHtml).join('')}</div>
      <div class="lat-verdict" id="latVerdict"><span class="lat-spin">…</span> ${uiText("measuring")}</div>
      <div class="lat-custom">
        <input id="latCustom" dir="ltr" data-i18n-ph="ping_address_hint" placeholder="${tr("ping_address_hint")}">
        ${icoBtn({id:'latCustomGo'},'pulse',tr("measure_address"),'violet')}
      </div>
      <p style="margin:0;font-size:10.5px;color:#8586a8;line-height:2">
        ${uiText("ping_reference")}
      </p>
    </div>`;

    createModal(tr("advisor_title"), body, async ()=>'');
    const overlay = $('#titanModal');
    if(!overlay) return;

    let panelEdge = {pop:'', zone:''};
    try{
      const hr = await fetch(latCb('/healthz'), {cache:'no-store'});
      panelEdge = {pop: hr.headers.get('x-railway-edge')||'', zone: hr.headers.get('x-railway-upstream-zone')||''};
    }catch(e){ /* not on Railway / header unavailable: the number still counts */ }

    const draw=(r)=>{ const el = overlay.querySelector('#lat-'+r.key); if(el) el.outerHTML = rowHtml(r); };
    onModalLanguage(overlay,()=>{ rows.forEach(draw); renderVerdict(); });

    const renderVerdict=()=>{
      const v=overlay.querySelector('#latVerdict');
      const done = rows.filter(r=>r.result);
      const byMs = done.slice().sort((a,b)=>a.result.ms-b.result.ms);
      const panel = rows.find(r=>r.key==='panel');
      const cf = rows.find(r=>r.key==='cf');
      const nodies = done.filter(r=>r.node);
      const lines = [];
      if(byMs.length) lines.push(`${uiText("fastest_route")} <b>${esc(displayName(byMs[0]))}</b> ${uiText("with_latency")} <b>${byMs[0].result.ms} ms</b>`);
      if(panel && panel.result && cf && cf.result){
        const gap = panel.result.ms - cf.result.ms;
        if(gap > 50) lines.push(`${uiText("panel_route_prefix")} <b>${uiText("panel")}</b> ${uiText("served_suffix")} <b>${gap} ms</b> ${uiText("ping_panel_gap")}`);
      }
      if(nodies.length){
        const best = nodies.slice().sort((a,b)=>a.result.ms-b.result.ms)[0];
        const floor = cf && cf.result ? cf.result.ms : null;
        if(floor!=null && best.result.ms - floor > 50)
          lines.push(`${uiText("best_node_prefix")} <b>${esc(displayName(best))}</b> ${uiText("with_latency")} <b>${best.result.ms} ms</b>${uiText("ping_gap_prefix")} <b>${best.result.ms - floor} ms</b> ${uiText("ping_near_hint")}`);
        else lines.push(`${uiText("best_node_open")}<b>${esc(displayName(best))}</b>${uiText("node_best_close")}`);
      }
      if(panelEdge.pop) lines.push(`${uiText("panel_region_label")} <b dir="ltr">${esc(panelEdge.pop)}</b>${EDGE_POPS[panelEdge.pop] ? ' — '+esc(tr(EDGE_POPS[panelEdge.pop])) : ''}${panelEdge.zone ? ' <span dir="ltr" class="muted">('+esc(panelEdge.zone)+')</span>' : ''}`);
      if(v) v.innerHTML = lines.join('<br>') || tr("no_measurements");
    };

    const measure=async()=>{
      const v = overlay.querySelector('#latVerdict');
      if(v) v.innerHTML = `<span class="lat-spin">…</span> ${uiText("measuring")}`;
      for(const r of rows){
        if(r.skip || !r.url) continue;
        r.result = await rttBest(r.url, r.mode, 3);
        draw(r);
      }
      renderVerdict();
    };

    setTimeout(()=>{
      const save = overlay.querySelector('#titanModalSave');
      if(save){ save.textContent=tr("measure_again"); save.setAttribute("data-i18n","measure_again"); save.onclick=()=>{ save.disabled=true; measure().finally(()=>{ save.disabled=false; }); }; }
      const cancel = overlay.querySelector('#titanModalCancel'); if(cancel){ cancel.textContent=tr("close"); cancel.setAttribute("data-i18n","close"); }
      const go = overlay.querySelector('#latCustomGo'), input = overlay.querySelector('#latCustom');
      if(go && input) go.onclick = async()=>{
        let u = String(input.value||'').trim(); if(!u) return;
        if(u.indexOf('://') < 0) u = 'https://'+u;
        const path = u.replace(/^https?:\/\/[^\/]+/i, '');
        if(!path || path === '/') u = u.replace(/\/+$/,'') + '/healthz';
        const r = {key:'x'+Date.now().toString(36), name:u.replace(/^https?:\/\//,''), url:u, mode:'no-cors', result:null, node:true};
        rows.push(r);
        const grid = overlay.querySelector('#latGrid'); if(grid) grid.insertAdjacentHTML('beforeend', rowHtml(r));
        go.disabled = true;
        try{ r.result = await rttBest(r.url, r.mode, 3); draw(r); }
        finally{ go.disabled = false; }
      };
      measure();
    }, 20);
  }

  async function openSubBuilder(sub, refresh){
    const cat = await apiJson('/api/subscriptions/catalog');
    const users = cat.users||[];
    const editing = sub||null;

    const picked = {};
    const keysOf = (uid)=> ((users.find(u=>u.uid===uid)||{}).configs||[]).map(c=>c.key);
    (editing && editing.items ? editing.items : []).forEach(it=>{
      picked[it.uid] = new Set(it.configs && it.configs.length ? it.configs : keysOf(it.uid));
    });
    const isOn = (uid,key)=>{ const s=picked[uid]; return !!s && s.has(key); };

    const rows = users.map(u=>{
      const chips = (u.configs||[]).map(c=>
        `<button type="button" class="sub-chip${isOn(u.uid,c.key)?' on':''}" data-sub-uid="${esc(u.uid)}" data-sub-key="${esc(c.key)}" data-tip="${esc(c.transport+'/'+c.security+' · '+(c.target==='node'?tr("on_node"):tr("on_panel")))}">${esc(c.label||c.key)}</button>`).join('');
      const stateKey = u.expired ? 'expired' : (u.enabled ? 'enabled' : 'off');
      const cls = u.expired ? 'warn' : (u.enabled ? '' : 'off');
      return `<div class="sub-user" data-uid="${esc(u.uid)}">
        <div class="sub-user-head">
          <span class="avatar user-avatar sub-medal sub-pic" data-sub-upic="${esc(u.uid)}" role="button" tabindex="0" data-i18n-tip="this_user_picture" data-tip="${tr("this_user_picture")}" data-i18n-aria="this_user_picture" aria-label="${tr("this_user_picture")}"><img src="${esc(u.avatar_url||'/static/img/titan-avatar.svg')}" alt=""></span>
          <span class="sub-user-name">${esc(u.name)}<span class="muted"> · ${esc((u.protocol||'').toUpperCase())}</span></span>
          <span class="pill ${cls}">${uiText(stateKey)}</span>
          <span class="spacer"></span>
          ${icoBtn({"type":"button","data-sub-all":u.uid},"checks",tr("all_user_configs"))}
          ${icoBtn({"type":"button","data-sub-none":u.uid},"xcircle",tr("none"))}
        </div>
        <div class="sub-chips">${chips || `<span class="muted">${uiText("no_user_configs_built")}</span>`}</div>
      </div>`;
    }).join('');

    createModal(editing?tr("edit_sub_link"):tr("create_sub_link"), `
      <div style="display:grid;gap:14px">
        <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("subscription_name")}
          <input id="subName" value="${esc(editing&&editing.name||'')}" data-i18n-ph="mobile_pack_example" placeholder="${tr("mobile_pack_example")}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">
        </label>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center">
          <div class="avatar user-avatar sub-medal" id="subAvPreview" style="width:46px;height:46px;overflow:hidden">
            <img src="${esc(avatarUrl(editing&&editing.avatar||''))}" alt="" style="width:100%;height:100%;object-fit:cover">
          </div>
          <div style="display:grid;gap:8px">
            <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
              <input type="hidden" id="subAvatar" value="${esc(editing&&editing.avatar||'')}">
              <button type="button" id="subAvPick" style="padding:8px 12px;border-radius:10px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.12);color:#eee9ff;cursor:pointer">${uiText("sub_choose_picture")}</button>
              <span style="font-size:10px;color:#8586a8">${uiText("sub_picture_hint")}</span>
            </div>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("plan_title_hint")}
              <input id="subPlan" value="${esc(editing&&editing.plan||'')}" data-i18n-ph="plan_example" placeholder="${tr('plan_example')}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">
            </label>
          </div>
        </div>
        <p style="margin:0;font-size:11px;color:#a8a6bf;line-height:2">
          ${uiText("sub_builder_hint")}
        </p>
        <div class="sub-list">${rows || `<div class="muted">${uiText("no_users_short")}</div>`}</div>
        <div class="sub-summary" id="subSummary"></div>
        ${editing?`<div class="sub-url" dir="ltr"><span>${esc(editing.url||'')}</span>${icoBtn({"type":"button","data-sub-copyurl":editing.id},"copy",tr("copy_link"),"violet")}</div>`:''}
      </div>`, async (overlay)=>{
        const name = $('#subName',overlay).value.trim();
        if(!name) throw new Error(tr("enter_sub_name"));
        const items = [];
        overlay.querySelectorAll('.sub-user').forEach(box=>{
          const uid = box.dataset.uid;
          const on = Array.from(box.querySelectorAll('.sub-chip.on')).map(c=>c.dataset.subKey);
          if(on.length) items.push({uid:uid, configs:on});
        });
        if(!items.length) throw new Error(tr("pick_config_required"));
        const body = {name:name, items:items,
                      avatar:$('#subAvatar',overlay).value||'',
                      plan:$('#subPlan',overlay).value.trim()};
        const res = editing ? await apiJson('/api/subscriptions/'+editing.id,{method:'PATCH',body:body})
                            : await apiJson('/api/subscriptions',{method:'POST',body:body});
        if(refresh) refresh();
        if(res.subscription && res.subscription.url){
          let copied=false;
          try{ await navigator.clipboard.writeText(res.subscription.url); copied=true; }catch(e){}
          return tr(copied?'sub_created_copied':'sub_created');
        }
        return tr("saved");
      });
    setTimeout(()=>{
      const overlay=$('#titanModal'); if(!overlay) return;
      const box=$('#subSummary',overlay);
      const paint=()=>{
        const n=Array.from(overlay.querySelectorAll('.sub-chip.on')).length;
        let u=0;
        overlay.querySelectorAll('.sub-user').forEach(b=>{ if(b.querySelector('.sub-chip.on')) u++; });
        if(box) box.textContent = n ? tr('sub_pick_count',{n:n,users:u}) : tr('sub_pick_none');
      };
      overlay.querySelectorAll('.sub-chip').forEach(chip=> chip.addEventListener('click', ()=>{
        chip.classList.toggle('on'); paint();
      }));
      overlay.querySelectorAll('[data-sub-all]').forEach(b=> b.addEventListener('click', ()=>{
        const uid=b.dataset.subAll;
        overlay.querySelectorAll(`.sub-chip[data-sub-uid="${uid}"]`).forEach(c=>c.classList.add('on')); paint();
      }));
      overlay.querySelectorAll('[data-sub-none]').forEach(b=> b.addEventListener('click', ()=>{
        const uid=b.dataset.subNone;
        overlay.querySelectorAll(`.sub-chip[data-sub-uid="${uid}"]`).forEach(c=>c.classList.remove('on')); paint();
      }));
      // each user's own picture — what the page falls back to when the link has none
      overlay.querySelectorAll('[data-sub-upic]').forEach(el=> el.addEventListener('click', async()=>{
        const uid=el.dataset.subUpic;
        const rec=users.find(x=>x.uid===uid)||{};
        try{
          const k=await openGalleryPicker(rec.avatar||'');
          if(k==null) return;
          await apiJson('/api/users/'+uid,{method:'PATCH',body:{avatar:k}});
          rec.avatar=k; rec.avatar_url=avatarUrl(k);
          const img=el.querySelector('img'); if(img) img.src=avatarUrl(k);
          toast(tr("user_picture_saved"));
        }catch(e){ toast(errorText(e.message)); }
      }));
      overlay.querySelectorAll('[data-sub-upic]').forEach(el=> el.addEventListener('keydown', (e)=>{
        if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); }
      }));
      const avPick=$('#subAvPick',overlay), avIn=$('#subAvatar',overlay), avImg=$('#subAvPreview img',overlay);
      if(avPick) avPick.onclick=async()=>{
        const k=await openGalleryPicker(avIn.value);
        if(k!=null){ avIn.value=k; if(avImg) avImg.src=avatarUrl(k); }
      };
      onModalLanguage(overlay,paint);
      const copyBtn=overlay.querySelector('[data-sub-copyurl]');
      if(copyBtn) copyBtn.addEventListener('click', async()=>{
        try{ await navigator.clipboard.writeText(editing.url||''); toast(tr("link_copied")); }catch(e){ toast(editing.url||''); }
      });
      paint();
    }, 20);
  }

  async function detectNode(addr, box, replaceLocation=false){
    if(!addr){ toast(tr('enter_node_domain')); return null; }
    const form=box && box.closest('#titanModal');
    const address=form && $('#mn_addr',form);
    const sequence=box ? (box._detectSequence||0)+1 : 0;
    if(box){ box._detectSequence=sequence; box.innerHTML=`<span class="lat-spin">…</span> ${uiText('detecting')} ${esc(addr)}`; }
    const fields=['name','city','country','cc','flag'];
    const before={};
    fields.forEach(key=>{ const el=form && $('#mn_'+key,form); if(el) before[key]=el.value; });
    let result;
    try{ result=await apiJson('/api/nodes/detect',{method:'POST',body:{address:addr}}); }
    catch(error){
      if(box && box._detectSequence===sequence) box.innerHTML=`<span class="det-bad">${uiText('detect_failed_prefix')} ${esc(errorText(error.message))}</span>`;
      return null;
    }
    if(!form || !form.isConnected || box._detectSequence!==sequence || address.value.trim()!==addr) return null;
    const found=result.fields||{}, identity=result.identity||{};
    const values={name:found.name||'',city:found.city||'',country:found.country||'',cc:found.country_code||'',flag:found.country_code?flagFor(found):''};
    fields.forEach(key=>{
      const el=$('#mn_'+key,form);
      if(!el || el.value!==before[key]) return;
      const replace=key!=='name' && replaceLocation;
      if(replace || !el.value || el.dataset.detected===el.value){
        el.value=values[key];
        el.dataset.detected=values[key];
      }
    });
    const place=found.country_code
      ? `${nodeFlag(found)} <span data-country-name="${TiTaNFlags.code(found)}">${esc(nodePlace(found))}</span>${found.city?' · '+esc(found.city):''}`
      : uiText('location_unknown');
    if(result.ok){
      box.innerHTML=`<div class="det-card">
        <div class="det-row"><span class="det-ok">${uiText('titan_node_detected')}</span><span class="muted" dir="ltr">v${esc(identity.version||'?')} · ${uiText(identity.role==='main'?'role_main':'role_node')}</span></div>
        <div class="det-row"><span>${place}</span><span class="muted" dir="ltr">${uiText('edge')} ${esc((identity.edge||{}).scheme||'https')} :${esc(String((identity.edge||{}).port||''))}</span></div>
        <div class="det-row"><span>${uiText(identity.credential?'node_credential_set':'node_credential_missing')}</span><span class="${identity.accepts_bootstrap?'det-ok':'det-bad'}">${uiText(identity.accepts_bootstrap?'save_connects':'setup_if_needed')}</span></div>
      </div>`;
    } else {
      box.innerHTML=`<div class="det-card"><div class="det-row"><span class="det-bad">${uiText(result.kind==='foreign'?'not_titan':'auto_detect_unavailable')}</span></div><div class="det-row">${place}</div><div class="det-row muted">${uiText('detect_manual_hint')}</div></div>`;
    }
    return result;
  }

  function quotaView(u){
    const gb=Number((u&&u.quota_gb)||0);
    const mb=Number((u&&u.quota_mb)||0);
    if(gb>0&&gb<1) return {value:String(Number(mb.toFixed(mb<10?1:0))), unit:'mb'};
    return {value:String(gb||0), unit:'gb'};
  }

  function avatarUrl(key){
    key=key||''; if(key.startsWith('gallery:')) return '/static/img/gallery/'+key.slice(8)+'.svg'; if(key.startsWith('upload:')) return '/api/gallery-image/'+key.slice(7); return '/static/img/titan-avatar.svg';
  }
  async function openGalleryPicker(current=''){
    return new Promise(resolve=>{
      let items=[]; let sel=current||'';
      const overlay=document.createElement('div');
      overlay.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(2,4,18,.62);backdrop-filter:blur(8px);display:grid;place-items:center;padding:16px;';
      overlay.innerHTML=`<div class="gallery-panel" style="width:min(520px,100%);background:linear-gradient(145deg,rgba(24,12,56,.96),rgba(8,6,26,.98));border:1px solid rgba(151,116,255,.42);border-radius:18px;overflow:hidden;max-height:90vh;display:flex;flex-direction:column">
        <div style="padding:16px 18px;border-bottom:1px solid rgba(151,116,255,.18);display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700;color:#f2edff">${uiText("choose_picture")}</div><button id="gpClose" data-i18n-aria="close" aria-label="${tr('close')}" style="width:32px;height:32px;border-radius:9px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.16);color:#d8c7ff;cursor:pointer">×</button></div>
        <div style="padding:16px;overflow:auto;flex:1">
          <button id="gpLogo" style="padding:8px 12px;border-radius:9px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.12);color:#eee9ff;cursor:pointer;margin-bottom:12px">${uiText("logo_titan")}</button>
          <div id="gpGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px"></div>
          <div style="margin-top:14px;display:flex;gap:8px"><button id="gpUploadBtn" style="padding:8px 12px;border-radius:9px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.12);color:#eee9ff;cursor:pointer">${uiText("upload_picture")}</button><input type="file" id="gpFile" accept="image/png,image/jpeg,image/webp" style="display:none"></div>
        </div>
        <div style="padding:14px 18px;border-top:1px solid rgba(151,116,255,.18);display:flex;justify-content:flex-end;gap:10px"><button id="gpCancel" style="padding:10px 14px;border-radius:10px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.12);color:#eee9ff;cursor:pointer">${uiText("cancel")}</button><button id="gpSave" style="padding:10px 16px;border-radius:10px;border:1px solid rgba(188,157,255,.5);background:linear-gradient(135deg,#7436f5,#4b1bb4);color:#fff;cursor:pointer">${uiText("save")}</button></div>
      </div>`;
      document.body.appendChild(overlay);
      const close=(v)=>{ closeModalElement(overlay); resolve(v); };
      overlay.addEventListener('click',e=>{ if(e.target===overlay) close(null); });
      $('#gpClose',overlay).onclick=()=>close(null);
      $('#gpCancel',overlay).onclick=()=>close(null);
      $('#gpSave',overlay).onclick=()=>close(sel);
      const render=()=>{
        const grid=$('#gpGrid',overlay);
        const logoBtn=$('#gpLogo',overlay);
        logoBtn.style.background = sel==='' ? 'linear-gradient(135deg,#7436f5,#4b1bb4)' : 'rgba(91,49,176,.12)';
        logoBtn.style.color = sel==='' ? '#fff' : '#eee9ff';
        grid.innerHTML = items.length ? items.map(it=>`
          <button data-key="${esc(it.id)}" style="position:relative;height:84px;border-radius:12px;overflow:hidden;border:1px solid ${sel===it.id?'rgba(188,157,255,.7)':'rgba(151,116,255,.18)'};background:rgba(10,20,39,.5);cursor:pointer;display:grid;place-items:center">
            <img src="${esc(it.url)}" style="width:100%;height:100%;object-fit:cover;display:block">
            ${sel===it.id?'<span style="position:absolute;inset:0;border:2px solid #a07bff;border-radius:12px;pointer-events:none"></span>':''}
            ${!it.builtin?'<span data-del="'+esc(it.id)+'" style="position:absolute;top:4px;left:4px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;display:grid;place-items:center;font-size:12px">×</span>':''}
          </button>
        `).join('') : `<div style="color:#8586a8;font-size:11px">${uiText("no_items")}</div>`;
      };
      overlay.querySelector('#gpGrid').addEventListener('click', async e=>{
        const del=e.target.closest('[data-del]');
        if(del){
          const key=del.dataset.del;
          if(key && key.startsWith('upload:')){
            try{ await apiJson('/api/gallery/'+key.slice(7),{method:'DELETE'}); items=items.filter(i=>i.id!==key); if(sel===key) sel=''; render(); }catch(err){ toast(errorText(err.message)); }
          }
          return;
        }
        const btn=e.target.closest('[data-key]');
        if(btn){ sel=btn.dataset.key; render(); }
      });
      $('#gpLogo',overlay).onclick=()=>{ sel=''; render(); };
      $('#gpUploadBtn',overlay).onclick=()=> $('#gpFile',overlay).click();
      $('#gpFile',overlay).addEventListener('change', async e=>{
        const f=e.target.files[0]; if(!f) return;
        const fd=new FormData(); fd.append('file',f);
        try{
          const r=await fetch('/api/gallery',{method:'POST',body:fd,credentials:'same-origin'});
          const d=await r.json().catch(()=>({}));
          if(r.ok){ items.push(d.item); sel=d.item.id; render(); } else toast(errorText(d.detail));
        }catch(err){ toast(errorText(err.message)); }
        e.target.value='';
      });
      (async()=>{ try{ const d=await apiJson('/api/gallery'); items=d.items||[]; render(); }catch(e){} })();
      render();
    });
  }

  async function loadMe(){
    try{
      const me=await apiJson('/api/me');
      if(me.username){
        const pn=$('.profile-name'); if(pn){ pn.removeAttribute("data-i18n"); pn.textContent=me.username; }
        const pr=$('.profile-role'); if(pr) pr.innerHTML='<span class="dot"></span> '+uiText(me.username==='TiTaN'?'role_super':'admin');
        const w=$('.welcome h1'); if(w) setText(w,'welcome_user',{name:me.username});
      }
      if(me.avatar && me.avatar.url){
        const av=$('.profile .avatar img'); if(av) av.src=me.avatar.url;
        const vvAv=$('.version-logo img'); if(vvAv) vvAv.src=me.avatar.url;
      }
    }catch(e){}
  }

  function drawChart(container, daily){
    const el = typeof container==='string' ? $(container) : container;
    if(!el) return;
    const yAxis = el.querySelector('.y-axis');
    const svgEl = el.querySelector('.chart-svg');
    const xAxis = el.querySelector('.chart-x');
    if(!daily || !daily.length || daily.every(d=>!d.up && !d.down)){
      if(svgEl) svgEl.style.display='none';
      if(xAxis) xAxis.innerHTML=`<span style="color:#8586a8;font-size:10px">${uiText("no_chart_data")}</span>`;
      if(yAxis) yAxis.innerHTML='<span>0</span><span>0</span><span>0</span><span>0</span><span>0</span>';
      return;
    }
    const max = Math.max(1, ...daily.map(d=> (d.up||0)+(d.down||0)));
    const W=760, H=170, padB=24;
    const points = daily.map((d,i)=>{
      const x = (i/(daily.length-1))*(W-20)+10;
      const y = H - padB - ((d.up+d.down)/max)*(H - padB - 20);
      return {x,y,v:d};
    });
    const path = points.map((p,i)=> (i===0?`M${p.x} ${p.y}`:`L${p.x} ${p.y}`)).join(' ');
    const area = path + ` L${points[points.length-1].x} ${H - padB} L${points[0].x} ${H - padB} Z`;
    const xLabels = daily.map(d=> new Date(d.t*1000).toLocaleDateString(I18N.locale,{month:'short',day:'numeric'}));
    if(svgEl){
      svgEl.style.display='';
      svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svgEl.innerHTML=`
        <defs>
          <linearGradient id="area2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a14fff" stop-opacity=".35"/><stop offset="1" stop-color="#a14fff" stop-opacity="0"/></linearGradient>
          <filter id="glow2"><feGaussianBlur stdDeviation="4.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d="${area}" fill="url(#area2)"/>
        <path d="${path}" fill="none" stroke="#9b49ff" stroke-width="2.2" filter="url(#glow2)"/>
        <path d="${path}" fill="none" stroke="#b45cff" stroke-width="1.1"/>
        ${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#b65cff" stroke="#170d37" stroke-width="2"/>`).join('')}
      `;
    }
    if(xAxis) xAxis.innerHTML = xLabels.map((l,i)=>`<span data-date-ts="${Number(daily[i].t)}" data-date-format="short">${esc(l)}</span>`).join('');
    if(yAxis){
      const steps=[max, max*0.75, max*0.5, max*0.25, 0];
      yAxis.innerHTML=steps.map(v=>`<span>${esc(fmtBytes(v))}</span>`).join('');
    }
  }

  async function loadOverview(){
    try{
      await TiTaNFlags.ready;
      const [stats, usersRes, nodesRes, reports] = await Promise.all([
        apiJson('/api/stats'),
        apiJson('/api/users'),
        apiJson('/api/nodes'),
        apiJson('/api/reports?days=7').catch(()=>({daily:[]}))
      ]);
      const users=usersRes.users||[]; const nodes=nodesRes.nodes||[];
      const online=nodes.filter(n=>n.enabled && n.status && n.status.online).length;
      const vv=$('.version-v'); if(vv && stats.app_version) vv.textContent='v'+stats.app_version;
      const totalTraffic=(stats.total_up||0)+(stats.total_down||0);
      const activeUsers=users.filter(u=>u.enabled && !(u.status && u.status.expired) && (u.status && u.status.live_enabled)).length;
      const cu=$('.card.users .card-number'); if(cu) cu.textContent=String(activeUsers);
      const cum=$('.card.users .card-meta'); if(cum) setText(cum,'stat_users_sub',{n:users.length});
      const ct=$('.card.traffic .card-number'); if(ct) ct.textContent=fmtBytes(totalTraffic);
      const ctm=$('.card.traffic .card-meta'); if(ctm) ctm.innerHTML=`↓ ${fmtBytes(stats.total_down||0)} &nbsp; ↑ ${fmtBytes(stats.total_up||0)}`;
      const cs=$('.card.servers .card-number'); if(cs) cs.textContent=String(nodes.length);
      const csm=$('.card.servers .card-meta'); if(csm) csm.innerHTML=`<span class="green">● ${uiText("stat_servers_sub",{n:online})}</span>`;
      const cc=$('.card.configs .card-number'); if(cc) cc.textContent=String(stats.enabled_count||0);
      const ccm=$('.card.configs .card-meta'); if(ccm) setText(ccm,'stat_configs_sub',{n:users.length});

      const srvContent=$('.server-content');
      if(srvContent){
        if(nodes.length){
          srvContent.innerHTML=nodes.slice(0,4).map(n=>{
            const st=n.status||{}; const lat=(st.latency_ms!=null?Number(st.latency_ms):null);
            const city=nodePlace(n); const cc=(n.country_code||'').toUpperCase();
            const flag=nodeFlag(n); const on=!!(n.enabled!==false && st.online);
            const pc=!on?'off':(lat==null?'off':(lat<90?'good':(lat<200?'mid':'bad')));
            return `<div class="server-row" title="${esc(nodeName(n))}"${n.is_local&&n.name==='سرور اصلی'?' data-i18n-title="main_node"':''}><div class="latency ping ${pc}">${lat!=null?lat+'ms':'—'}<small>${uiText("latency_short")}</small></div><div class="status ${on?'on':'off'}">${uiText(on?"online":"offline")}</div><div class="location"><span class="sr-medal">${flag}</span><span><span class="sr-name">${nodeNameLabel(n)}</span><span class="sr-loc">${placeLabel(n)}${cc?' · '+cc:''}</span></span></div></div>`;
          }).join('');
        } else srvContent.innerHTML=`<div style="color:#8586a8;font-size:11px;padding:12px">${uiText("no_nodes_short")}</div>`;
      }

      const ruHead=document.querySelector('.recent-panel.users-table .recent-table');
      if(ruHead){
        ruHead.querySelectorAll('.recent-table-row,.recent-empty').forEach(r=>r.remove());
        const recent=[...users].sort((a,b)=>(b.created_at||0)-(a.created_at||0)).slice(0,3);
        if(recent.length===0) ruHead.insertAdjacentHTML('beforeend',`<div class="recent-empty" style="padding:14px;color:#8586a8;font-size:11px">${uiText("no_users_period")}</div>`);
        else recent.forEach(u=>{
          const av=(u.avatar_url||'/static/img/titan-avatar.svg'); const st=u.status||{}; const used=fmtBytes(st.used||0);
          const statusKey=st.expired?'expired':(!u.enabled?'rep_disabled':'enabled');
          const row=document.createElement('div'); row.className='recent-table-row';
          row.innerHTML=`<div class="recent-user"><span class="recent-avatar user-avatar"><img src="${esc(av)}" alt=""></span><span class="recent-name">${esc(u.name)}</span></div><div class="recent-traffic">${esc(used)}</div><div class="recent-status">${uiText(statusKey)}</div>`;
          ruHead.appendChild(row);
        });
      }
      const rcHead=document.querySelector('.recent-panel.configs-table .recent-table');
      if(rcHead){
        rcHead.querySelectorAll('.recent-table-row,.recent-empty').forEach(r=>r.remove());
        const nodeMap={}; nodes.forEach(n=>nodeMap[n.id]=n);
        const recent=[...users].sort((a,b)=>(b.created_at||0)-(a.created_at||0)).slice(0,3);
        if(recent.length===0) rcHead.insertAdjacentHTML('beforeend',`<div class="recent-empty" style="padding:14px;color:#8586a8;font-size:11px">${uiText("no_configs_period")}</div>`);
        else recent.forEach(u=>{
          const av=(u.avatar_url||'/static/img/titan-avatar.svg'); const n=nodeMap[u.node_id||1];
          const flag=nodeFlag(n||{}); const loc=n?nodePlace(n):tr('unknown');
          const st=u.status||{}; const statusKey=st.expired?'expired':(!u.enabled?'rep_disabled':'enabled');
          const row=document.createElement('div'); row.className='recent-table-row';
          row.innerHTML=`<div class="recent-config"><span class="recent-avatar user-avatar"><img src="${esc(av)}" alt=""></span><span class="recent-name">${esc(u.name)}</span></div><div>${esc((u.protocol||'').toUpperCase())}</div><div class="recent-server"><span class="flag">${flag}</span><span>${placeLabel(n||{})}</span></div><div class="recent-status">${uiText(statusKey)}</div>`;
          rcHead.appendChild(row);
        });
      }

      // real traffic chart
      const chartArea=$('.chart-area');
      if(chartArea && reports.daily){
        drawChart(chartArea, reports.daily);
      }
    }catch(e){ console.error('loadOverview',e); }
  }

  function closeModalElement(overlay){
    if(overlay._languageAbort) overlay._languageAbort.abort();
    overlay.remove();
  }
  function onModalLanguage(overlay, update){
    if(!overlay._languageAbort) overlay._languageAbort=new AbortController();
    document.addEventListener('titan:lang',update,{signal:overlay._languageAbort.signal});
  }

  // --- modals ---
  function createModal(title, bodyHtml, onSave){
    const ex=$('#titanModal'); if(ex) closeModalElement(ex);
    const overlay=document.createElement('div'); overlay.id='titanModal';
    overlay.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(2,4,18,.62);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px;';
    overlay.innerHTML=`<div class="modal-panel" style="width:min(640px,100%);max-height:92vh;overflow:auto;background:linear-gradient(145deg,rgba(24,12,56,.96),rgba(8,6,26,.98));border:1px solid rgba(151,116,255,.42);border-radius:18px;box-shadow:0 0 30px rgba(94,48,205,.22);">
      <div style="position:sticky;top:0;z-index:1;background:linear-gradient(145deg,rgba(24,12,56,1),rgba(12,8,32,1));padding:18px 20px;border-bottom:1px solid rgba(151,116,255,.18);display:flex;align-items:center;justify-content:space-between"><div style="font-weight:700;color:#f2edff">${uiText(I18N.keyFor(title) || title)}</div><button id="titanModalClose" data-i18n-aria="close" aria-label="${tr('close')}" style="width:32px;height:32px;border-radius:9px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.16);color:#d8c7ff;cursor:pointer">×</button></div>
      <div style="padding:18px 20px">${bodyHtml}</div>
      <div style="position:sticky;bottom:0;background:linear-gradient(145deg,rgba(24,12,56,1),rgba(8,6,26,1));padding:14px 20px;border-top:1px solid rgba(151,116,255,.18);display:flex;gap:10px;justify-content:flex-end"><button id="titanModalCancel" data-i18n="cancel" style="padding:10px 14px;border-radius:10px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.12);color:#eee9ff;cursor:pointer">${uiText("cancel")}</button><button id="titanModalSave" data-i18n="save" style="padding:10px 16px;border-radius:10px;border:1px solid rgba(188,157,255,.5);background:linear-gradient(135deg,#7436f5,#4b1bb4);color:#fff;cursor:pointer">${uiText("save")}</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const close=()=>closeModalElement(overlay);
    $('#titanModalClose',overlay).onclick=close;
    $('#titanModalCancel',overlay).onclick=close;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) close(); });
    $('#titanModalSave',overlay).onclick=async()=>{
      const btn=$('#titanModalSave',overlay); btn.disabled=true; const old=btn.textContent; btn.textContent='...';
      try{ const msg = await onSave(overlay); close(); toast(msg || tr("done")); loadOverview(); }
      catch(e){ toast(errorText(e.message)); }
      finally{ btn.disabled=false; btn.textContent=old; }
    };
  }

  // --- full user/config modal (all previous settings) ---
  async function openUserModal(existing=null){
    const settings = await apiJson('/api/settings').catch(()=>({}));
    const nodesRes = await apiJson('/api/nodes').catch(()=>({nodes:[]}));
    const nodes = nodesRes.nodes||[];
    const isEdit = !!existing;
    const u = existing || {};
    const nodeOptions = () => `<option value="0">${tr("node_auto_short")}</option>` + nodes.map(n=>`<option value="${n.id}" ${String(u.node_id||0)===String(n.id)?'selected':''}>${esc(flagFor(n))} ${esc(nodeName(n))}${(n.sync&&n.sync.ok===false)?' ⚠':''}</option>`).join('');
    const nodeInfo={}; nodes.forEach(n=>{ nodeInfo[String(n.id)]={name:n.name, source:n, local:!!n.is_local, enabled:n.enabled!==false,
      online:!!(n.status&&n.status.online), cred:!!(n.sync&&n.sync.has_credential), ok:(n.sync&&n.sync.ok)===true, err:(n.sync&&n.sync.error)||''}; });
    // Say what picking this server means *before* saving: a node that cannot take
    // the user is exactly how a config ends up on the main domain by surprise.
    const nodeHint=(id)=>{
      const i=nodeInfo[String(id)];
      if(i) i.name=nodeName(i.source);
      if(!i || String(id)==='0') return {text:tr("node_auto_hint"), cls:''};
      if(!i.enabled) return {text:tr("node_maintenance_hint"), cls:'warn'};
      const reason = !i.cred ? tr("node_needs_credential") : (i.ok ? '' : (i.err?(tr("sync_failed_prefix")+errorText(i.err)):tr("never_synced")));
      if(reason) return {text:'⚠ '+i.name+': '+reason+tr("node_fallback_hint"), cls:'warn'};
      if(!i.online) return {text:'⚠ '+i.name+tr("node_offline_hint"), cls:'warn'};
      return {text:tr("served_check_prefix")+i.name+tr("served_on_suffix")+(i.online?tr("online"):tr("unknown_short"))+').', cls:'ok'};
    };
    const protocols=['vless','vmess','trojan','shadowsocks','hysteria2','wireguard'];
    const transports=['ws','xhttp','grpc','tcp','httpupgrade'];
    const fingerprints=['chrome','firefox','safari','ios','android','edge','random','randomized'];
    const alpns=['http/1.1','h2,http/1.1','h3,h2,http/1.1',''];
    const ssMethods=['2022-blake3-aes-128-gcm','2022-blake3-aes-256-gcm','2022-blake3-chacha20-poly1305','aes-128-gcm','aes-256-gcm','chacha20-ietf-poly1305'];
    const expireDays = u.expire_at ? Math.max(0, Math.ceil((u.expire_at - Date.now()/1000)/86400)) : 0;

    createModal(isEdit?tr("edit_user_config"):tr("add_user_config"), `
      <div style="display:grid;gap:16px">
        <div style="display:flex;gap:12px;align-items:center">
          <div id="avPreview" style="width:54px;height:54px;border-radius:14px;overflow:hidden;border:1px solid rgba(151,116,255,.3);background:rgba(10,20,39,.6);display:grid;place-items:center"><img src="${esc(avatarUrl(u.avatar||''))}" style="width:100%;height:100%;object-fit:cover"></div>
          <input type="hidden" id="mu_avatar" value="${esc(u.avatar||'')}">
          <button type="button" id="avPickBtn" style="padding:8px 12px;border-radius:10px;border:1px solid rgba(151,116,255,.24);background:rgba(91,49,176,.12);color:#eee9ff;cursor:pointer">${uiText("choose_picture")}</button>
          <span style="font-size:10px;color:#8586a8">${uiText("user_profile_hint")}</span>
        </div>
        <div class="modal-columns" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("name_required_label")}<input id="mu_name" value="${esc(u.name||'')}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("note")}<input id="mu_note" value="${esc(u.note||'')}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
        </div>
        <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("wizard_server")}<select id="mu_node" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">${nodeOptions()}</select></label>
        <div id="mu_nodeHint" class="node-hint"></div>
        <div id="mu_edgeState" class="node-hint" style="display:none"></div>
        <div class="modal-columns" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("protocol")}<select id="mu_protocol" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">${protocols.map(p=>`<option value="${p}" ${ (u.protocol||'vless')===p?'selected':''}>${p.toUpperCase()}</option>`).join('')}</select></label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("transport")}<select id="mu_transport" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">${transports.map(t=>`<option value="${t}" ${(u.transport||settings.default_transport||'ws')===t?'selected':''}>${t.toUpperCase()}</option>`).join('')}</select></label>
        </div>
        <div id="ssRow" style="display:${(u.protocol||'vless')==='shadowsocks'?'flex':'none'};flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("ss_cipher")}<select id="mu_ss" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">${ssMethods.map(m=>`<option value="${m}" ${(u.ss_method||settings.ss_method||'2022-blake3-aes-128-gcm')===m?'selected':''}>${m}</option>`).join('')}</select></div>
        <div class="modal-columns" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("sec_security")}<select id="mu_security" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"><option value="tls" ${(u.security||'tls')==='tls'?'selected':''}>TLS</option><option value="none" ${u.security==='none'?'selected':''} data-i18n="none">${tr("none")}</option><option value="reality" ${u.security==='reality'?'selected':''}>Reality</option></select></label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("fingerprint_short")}<select id="mu_fp" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">${fingerprints.map(f=>`<option value="${f}" ${(u.fingerprint||settings.default_fingerprint||'chrome')===f?'selected':''}>${f}</option>`).join('')}</select></label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">ALPN<select id="mu_alpn" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">${alpns.map(a=>`<option value="${a}" ${(u.alpn??settings.default_alpn??'http/1.1')===a?'selected':''}>${a||'—'}</option>`).join('')}</select></label>
        </div>
        <div class="modal-columns" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("quota")}
            <span style="display:flex;gap:8px">
              <input id="mu_quota" type="number" step="0.1" min="0" value="${quotaView(u).value}" style="flex:1;background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">
              <select id="mu_quota_unit" style="width:78px;background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">
                <option value="gb" ${quotaView(u).unit==='gb'?'selected':''}>GB</option>
                <option value="mb" ${quotaView(u).unit==='mb'?'selected':''}>MB</option>
              </select>
            </span>
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("expiry_days_short")}<input id="mu_expire" type="number" value="${expireDays}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
        </div>
        <div class="modal-columns" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("device_limit")}<input id="mu_devices" type="number" value="${u.max_devices||0}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("request_limit")}<input id="mu_requests" type="number" value="${u.max_requests||0}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
        </div>
        <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("allowed_ips_hint")}<input id="mu_ips" value="${esc((u.allowed_ips||[]).join(','))}" dir="ltr" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
      </div>
    `, async (overlay)=>{
      const body={
        name: $('#mu_name',overlay).value.trim()||'User',
        note: $('#mu_note',overlay).value,
        node_id: parseInt($('#mu_node',overlay).value)||0,
        protocol: $('#mu_protocol',overlay).value,
        transport: $('#mu_transport',overlay).value,
        security: $('#mu_security',overlay).value,
        fingerprint: $('#mu_fp',overlay).value,
        alpn: $('#mu_alpn',overlay).value,
        ss_method: $('#mu_ss',overlay) ? $('#mu_ss',overlay).value : undefined,
        quota_gb: $('#mu_quota_unit',overlay).value==='gb' ? (parseFloat($('#mu_quota',overlay).value)||0) : 0,
        quota_mb: $('#mu_quota_unit',overlay).value==='mb' ? (parseFloat($('#mu_quota',overlay).value)||0) : 0,
        expire_days: parseInt($('#mu_expire',overlay).value)||0,
        max_devices: parseInt($('#mu_devices',overlay).value)||0,
        max_requests: parseInt($('#mu_requests',overlay).value)||0,
        allowed_ips: ($('#mu_ips',overlay).value||'').split(',').map(s=>s.trim()).filter(Boolean),
        avatar: $('#mu_avatar',overlay).value,
        client_nonce: Math.random().toString(36).slice(2)+Date.now().toString(36)
      };
      const res = isEdit
        ? await apiJson('/api/users/'+u.uid,{method:'PATCH',body})
        : await apiJson('/api/users',{method:'POST',body});
      setTimeout(()=>{ const ev=new Event('titan:refresh'); document.dispatchEvent(ev); }, 100);
      // Tell the admin where the config actually landed — the panel's own link is
      // a valid answer, but it must never be a silent surprise.
      const ns=res.node_sync||{};
      if(ns.node_id && ns.ok) return tr('user_pushed',{node:ns.node_name});
      if(ns.node_id && !ns.ok) return tr('user_push_failed',{error:errorText(ns.error)});
      return tr("saved");
    });

    setTimeout(()=>{
      const overlay=$('#titanModal'); if(!overlay) return;
      const avBtn=$('#avPickBtn',overlay), avIn=$('#mu_avatar',overlay), avImg=$('#avPreview img',overlay);
      if(avBtn) avBtn.onclick=async()=>{
        const k=await openGalleryPicker(avIn.value);
        if(k!=null){ avIn.value=k; if(avImg) avImg.src=avatarUrl(k); }
      };
      const protoSel=$('#mu_protocol',overlay), ssRow=$('#ssRow',overlay), transSel=$('#mu_transport',overlay), secSel=$('#mu_security',overlay);
      const updateDeps=()=>{
        if(!protoSel) return;
        const p=protoSel.value; const noNet=(p==='hysteria2'||p==='wireguard');
        if(transSel) transSel.disabled=noNet;
        if(secSel) secSel.disabled=noNet;
        if(ssRow) ssRow.style.display = p==='shadowsocks' ? 'flex' : 'none';
      };
      if(protoSel) protoSel.addEventListener('change',updateDeps);
      updateDeps();
      const nodeSel=$('#mu_node',overlay), hint=$('#mu_nodeHint',overlay);
      const paint=()=>{ if(!nodeSel||!hint) return; const h=nodeHint(nodeSel.value); nodeSel.style.backgroundImage=`url("${TiTaNFlags.src(nodes.find(n=>String(n.id)===nodeSel.value)||{})}")`; hint.textContent=h.text; hint.className='node-hint '+(h.cls||''); };
      if(nodeSel) nodeSel.addEventListener('change',paint);
      onModalLanguage(overlay,()=>{
        if(nodeSel){ const selected=nodeSel.value; nodeSel.innerHTML=nodeOptions(); nodeSel.value=selected; }
        paint();
      });
      paint();

      const state=$('#mu_edgeState',overlay);
      if(state){
        const ep=(existing&&existing.endpoint)||null;
        const warns=((existing&&existing.edge_warnings)||[]).filter(Boolean);
        if(ep&&ep.host){
          const tags=[esc(String(ep.transport||'').toUpperCase())+'/'+esc(String(ep.security||'').toUpperCase())];
          tags.push(ep.raw?tr("raw_tcp"):tr("https_path"));
          if(ep.target==='node'&&ep.node) tags.push(tr("on_prefix")+esc(ep.node));
          state.innerHTML=`<b>${tags.join(' · ')}</b> <span dir="ltr">${esc(ep.host)}:${esc(String(ep.port))}</span>`
            +(warns.length?('<br>'+warns.map(w=>'• '+routeWarning(w)).join('<br>')):'');
          state.className='node-hint '+(warns.length?'warn':'ok');
          state.style.display='block';
        }
      }
    }, 20);
  }

  function openNodeSetupModal(res){
    const setup=res.setup||{}; const sync=res.sync_now||{};
    const probe=(res.discovery&&res.discovery.kind)||res.kind||'';
    const who=(res.discovery&&res.discovery.identity)||res.identity||{};
    const claim=(res.discovery&&res.discovery.claim)||res.claim||{};
    const lines=(setup.lines||[]).map(l=>{
      const i=l.indexOf('=');
      return `<div class="env-line"><span class="env-k">${esc(l.slice(0,i))}</span><span class="env-v" dir="ltr">${esc(l.slice(i+1))}</span></div>`;
    }).join('');
    createModal(tr("setup_node"), `
      <div style="display:grid;gap:14px">
        <div class="nl-note ${sync.ok?'':'bad'}" style="margin:0">
          ${sync.ok ? tr("node_responded_synced")
                    : tr("node_no_response")+(sync.error?' ('+esc(sync.error)+')':'')+tr("node_fallback_setup")}
        </div>
        <div class="det-card">
          ${probe==='titan'
            ? `<div class="det-row"><span class="det-ok">${uiText("node_detected")}</span><span class="muted" dir="ltr">${esc(who.version||'')} · ${uiText(who.role==='main'?'role_main':'role_node')}</span></div>`
            : `<div class="det-row"><span class="det-bad">${uiText("auto_detect_failed")}</span><span class="muted" dir="ltr">${uiText(probe==='foreign'?'not_titan':'auto_detect_unavailable')}</span></div>`}
          ${claim&&claim.ok? `<div class="det-row"><span class="det-ok">${uiText("claim_success")}</span></div>`:''}
          ${claim&&claim.error? `<div class="det-row"><span class="det-bad">${uiText("claim_failed_open")}${esc(errorText(claim.error))})</span><span class="muted">${uiText("set_variables")}</span></div>`:''}
        </div>
        <p style="margin:0;font-size:11px;color:#a8a6bf;line-height:2">
          ${uiText("setup_instructions")}
        </p>
        <div style="display:flex;align-items:center;gap:10px">
          ${icoBtn({"type":"button","id":"setupCopyAll"},"copy",tr("copy_all_variables"),"violet")}
          <span style="font-size:11px;color:#a8a6bf">${uiText("copy_raw_editor")}</span>
        </div>
        <div class="env-list">${lines}</div>
        <p style="margin:0;font-size:10.5px;color:#8586a8;line-height:2">${tr('setup_note')}</p>
      </div>`, async ()=>{ /* nothing to save: it is a recipe */ });
    setTimeout(()=>{
      const overlay=$('#titanModal'); if(!overlay) return;
      const list=$('.env-list',overlay);
      if(list) list.addEventListener('click', async(e)=>{
        const line=e.target.closest('.env-line'); if(!line) return;
        const text=line.querySelector('.env-k').textContent+'='+line.querySelector('.env-v').textContent;
        try{ await navigator.clipboard.writeText(text); toast(tr("copy_done")); }catch(err){ toast(text); }
      });
      const copyAll=$('#setupCopyAll',overlay);
      if(copyAll) copyAll.addEventListener('click', async()=>{
        const text=(setup.block || (setup.lines||[]).join('\n'));
        try{ await navigator.clipboard.writeText(text); toast(tr("variables_copied")); }
        catch(err){ toast(tr("copy_failed_manual")); }
      });
      const save=$('#titanModalSave',overlay);
      if(save){ save.textContent=tr("got_it"); save.setAttribute("data-i18n","got_it"); save.onclick=()=>closeModalElement(overlay); }
    }, 20);
  }

  function wireRowExtras(tbody, refresh){
    tbody.querySelectorAll('[data-act="qr"]').forEach(b=> b.addEventListener('click', ()=>{
      window.open('/api/users/'+b.dataset.uid+'/qr','_blank');
    }));
    tbody.querySelectorAll('[data-act="power"]').forEach(b=> b.addEventListener('click', async()=>{
      const uid=b.dataset.uid; const on=b.dataset.on==='1';
      b.disabled=true;
      try{
        await apiJson('/api/users/'+uid,{method:'PATCH',body:{enabled:!on}});
        toast(on?tr("config_disabled"):tr("config_enabled"));
        refresh(); loadOverview();
      }catch(e){ toast(errorText(e.message)); } finally{ b.disabled=false; }
    }));
  }

  async function openSubConfigModal(uid, refresh){
    const info = await apiJson('/api/users/'+uid+'/sub-configs');
    const configs = info.configs||[];
    if(!configs.length){ toast(tr("no_user_configs")); return; }
    const rows = configs.map((c,i)=>`
      <label class="cfg-pick" data-key="${esc(c.key)}">
        <input type="checkbox" ${c.included?'checked':''} data-key="${esc(c.key)}">
        <span class="cfg-pick-body">
          <span class="cfg-pick-name">${esc(c.protocol.toUpperCase())} · ${esc(c.key.toUpperCase())}</span>
          <span class="cfg-pick-host" dir="ltr">${esc(c.host)}:${esc(String(c.port))} · ${esc(c.transport)}/${esc(c.security||'none')}${c.target==='node'?' · node':' · panel'}</span>
        </span>
      </label>`).join('');
    createModal(tr("sub_configs"), `
      <div style="display:grid;gap:12px">
        <p style="margin:0;font-size:11px;color:#a8a6bf;line-height:2">
          ${uiText("sub_picker_hint")}
        </p>
        <div class="cfg-pick-list">${rows}</div>
        <div style="display:flex;gap:10px;align-items:center;font-size:11px;color:#a8a6bf">
          ${icoBtn({"type":"button","id":"cfgPickAll"},"checks",tr("select_all"))}
          ${icoBtn({"type":"button","id":"cfgPickNone"},"xcircle",tr("none"))}
          <span style="direction:ltr" dir="ltr">${esc(info.sub_url||'')}</span>
        </div>
      </div>`, async (overlay)=>{
        const picked=Array.from(overlay.querySelectorAll('.cfg-pick input:checked')).map(c=>c.dataset.key);
        await apiJson('/api/users/'+uid+'/sub-configs',{method:'PATCH',body:{transports:picked}});
        if(refresh) refresh();
      });
    setTimeout(()=>{
      const overlay=$('#titanModal'); if(!overlay) return;
      const all=$('#cfgPickAll',overlay), none=$('#cfgPickNone',overlay);
      const boxes=()=>Array.from(overlay.querySelectorAll('.cfg-pick input'));
      if(all) all.onclick=()=>boxes().forEach(b=>{ b.checked=true; });
      if(none) none.onclick=()=>boxes().forEach(b=>{ b.checked=false; });
    }, 20);
  }

  async function openNodeModal(existing=null){
    const isEdit=!!existing; const n=existing||{};
    createModal(isEdit?tr("edit_server"):tr("add_server"), `
      <div style="display:grid;gap:12px">
        <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("name_required_label")}<input id="mn_name" value="${esc(n.name||'')}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
        <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("node_domain_only")}
          <span style="display:flex;gap:8px;align-items:center">
            <input id="mn_addr" value="${esc(n.address||'')}" dir="ltr" placeholder="your-node.up.railway.app" style="flex:1;background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px">
            ${icoBtn({"type":"button","id":"mn_detect"},"pulse",tr("node_auto_detect"),"violet")}
          </span>
        </label>
        <div id="mn_detectBox"></div>
        <div class="modal-columns" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("city")}<input id="mn_city" value="${esc(n.city||'')}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("country")}<input id="mn_country" value="${esc(n.country||'')}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
        </div>
        <div class="modal-columns" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("country_code_short")}<input id="mn_cc" value="${esc(n.country_code||'')}" maxlength="2" style="text-transform:uppercase;background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:11px;color:#a8a6bf">${uiText("flag")}<input id="mn_flag" value="${esc(n.country_code||n.flag?flagFor(n):'')}" style="background:rgba(10,20,39,.8);border:1px solid rgba(108,125,165,.18);border-radius:10px;color:#e9e6f6;padding:11px"></label>
        </div>
        <div style="font-size:10px;color:#7d829d">${uiText("node_domain_hint")}</div>
      </div>
    `, async (overlay)=>{
      const body={
        name: $('#mn_name',overlay).value.trim(),
        address: $('#mn_addr',overlay).value.trim(),
        city: $('#mn_city',overlay).value.trim(),
        country: $('#mn_country',overlay).value.trim(),
        country_code: $('#mn_cc',overlay).value.trim(),
        flag: $('#mn_flag',overlay).value.trim()
      };
      if(!body.name && !body.address) throw new Error(tr("node_name_or_domain"));
      let message=tr("done");
      if(isEdit){
        const res=await apiJson('/api/nodes/'+n.id,{method:'PATCH',body});
        const st=(res.node&&res.node.sync)||{};
        if(st.ok===false) message=tr('node_unreachable_fallback',{error:errorText(st.error)});
      } else {
        const res=await apiJson('/api/nodes',{method:'POST',body});
        const found=(res.discovery&&res.discovery.kind==='titan');
        if(res.sync_now && res.sync_now.ok===false) openNodeSetupModal(res);
        else message=(found? tr("node_detected_connected") : tr("node_added_synced"));
      }
      setTimeout(()=> document.dispatchEvent(new Event('titan:refresh')), 100);
      return message;
    });
    setTimeout(()=>{
      const overlay=$('#titanModal'); if(!overlay) return;
      const ccIn=$('#mn_cc',overlay), flagIn=$('#mn_flag',overlay);
      if(ccIn && flagIn) ccIn.addEventListener('input',()=>{ flagIn.value = flagFor(ccIn.value); });
      const addrIn=$('#mn_addr',overlay), detBtn=$('#mn_detect',overlay), box=$('#mn_detectBox',overlay);
      if(detBtn) detBtn.addEventListener('click', async()=>{ detBtn.disabled=true; try{ await detectNode(addrIn.value.trim(), box, true); } finally{ detBtn.disabled=false; } });
      if(addrIn) addrIn.addEventListener('input',()=>{
        if(box){ box._detectSequence=(box._detectSequence||0)+1; box.innerHTML=''; }
        ['name','city','country','cc','flag'].forEach(key=>{
          const el=$('#mn_'+key,overlay);
          if(el && el.dataset.detected && el.value===el.dataset.detected){ el.value=''; delete el.dataset.detected; }
        });
      });
      if(addrIn) addrIn.addEventListener('blur', ()=>{ if(addrIn.value.trim() && box && !box.innerHTML) detectNode(addrIn.value.trim(), box); });
    }, 20);
  }

  function wireDetails(){
    // hide export button in users section (keep only Add User)
    $$('.section-view[data-section="users"] .section-actions button').forEach(b=>{
      if(b.dataset.i18nTip==='export_users') b.style.display='none';
    });

    const usersSection=document.querySelector('.section-view[data-section="users"]');
    if(usersSection){
      const tbody=usersSection.querySelector('.data-table tbody');
      const search=usersSection.querySelector('[data-filter="users"]');
      async function refreshUsers(){
        try{
          const d=await apiJson('/api/users'); const users=d.users||[];
          // update the 3 top cards with real data
          const cards=usersSection.querySelectorAll('.section-grid .detail-card');
          if(cards[0]){
            const total=users.length;
            const active=users.filter(u=> u.enabled && !(u.status&&u.status.expired) && u.status&&u.status.live_enabled).length;
            const connecting=users.filter(u=> (u.status&&u.status.active_connections>0)).length;
            const disabled=users.filter(u=> !u.enabled && !(u.status&&u.status.expired)).length;
            cards[0].innerHTML=`<h3>${uiText("rep_active")}</h3><div class="metric-row"><span>${uiText("total_count")}</span><strong>${total}</strong></div><div class="metric-row"><span>${uiText("connecting")}</span><strong>${connecting}</strong></div><div class="metric-row"><span>${uiText("rep_disabled")}</span><strong>${disabled}</strong></div>`;
            if(cards[1]){
              const totalUsed=users.reduce((a,u)=>a+((u.status&&u.status.used)||0),0);
              cards[1].innerHTML=`<h3>${uiText("traffic_usage")}</h3><div class="metric-row"><span>${uiText("total_used")}</span><strong>${esc(fmtBytes(totalUsed))}</strong></div><div class="metric-row"><span>${uiText("users_count_label")}</span><strong>${total}</strong></div><div class="progress"><span style="width:${Math.min(100, Math.round((totalUsed/(10*1024*1024*1024))*100))}%"></span></div>`;
            }
            if(cards[2]){
              const activeSub=active; const nearExpire=users.filter(u=> u.expire_at && (u.expire_at - Date.now()/1000) < 3*86400 && !(u.status&&u.status.expired)).length;
              const expired=users.filter(u=> u.status&&u.status.expired).length;
              cards[2].innerHTML=`<h3>${uiText("sub_status")}</h3><div class="metric-row"><span>${uiText("enabled")}</span><span class="pill">● ${activeSub} ${uiText("accounts")}</span></div><div class="metric-row"><span>${uiText("near_expiry")}</span><span class="pill warn">${nearExpire} ${uiText("accounts")}</span></div><div class="metric-row"><span>${uiText("expired")}</span><span class="pill off">${expired} ${uiText("accounts")}</span></div>`;
            }
          }
          if(tbody){
            tbody.innerHTML=users.length? users.map(u=>{
              const st=u.status||{}; const used=fmtBytes(st.used||0);
              const days=u.expire_at? uiText('days_count',{n:Math.max(0,Math.ceil((u.expire_at - Date.now()/1000)/86400))}):uiText('never');
              const statusKey=st.expired?'expired':(!u.enabled?'rep_disabled':'enabled'); const cls=st.expired?'warn':(!u.enabled?'off':'');
              const on = !!u.enabled && !(st.expired);
              return `<tr><td><span class="user-cell"><span class="avatar user-avatar"><img src="${esc(u.avatar_url||'/static/img/titan-avatar.svg')}" alt=""></span>${esc(u.name)}</span></td><td class="muted">#${esc(u.uid.slice(0,6))}</td><td>${esc(used)}</td><td>${days}</td><td><span class="pill ${cls}">${uiText(statusKey)}</span></td><td><div class="row-actions">${icoBtn({"data-uid":u.uid,"data-act":"edit"},"edit",tr("edit_user"),"gold")}${icoBtn({"data-uid":u.uid,"data-act":"detail"},"link",tr("copy_connection"),"violet")}${icoBtn({"data-uid":u.uid,"data-act":"qr"},"qr",tr("qr_code"),"")}${icoBtn({"data-uid":u.uid,"data-act":"configs"},"sliders",tr("user_sub_configs"),"gold")}${icoBtn({"data-uid":u.uid,"data-act":"power","data-on":on?1:0},"power",on?tr("turn_off"):tr("turn_on"),on?"":"ok")}${icoBtn({"data-uid":u.uid,"data-act":"del"},"trash",tr("gallery_remove"),"danger")}</div></td></tr>`;
            }).join('') : `<tr><td colspan="6" style="text-align:center;color:#8586a8">${uiText("no_users_plain")}</td></tr>`;
            tbody.querySelectorAll('[data-act="del"]').forEach(b=> b.addEventListener('click', async()=>{ const uid=b.dataset.uid; if(!confirm(tr("delete_user_confirm"))) return; try{ await apiJson('/api/users/'+uid,{method:'DELETE'}); toast(tr("deleted")); refreshUsers(); loadOverview(); }catch(e){toast(errorText(e.message));} }));
            tbody.querySelectorAll('[data-act="detail"]').forEach(b=> b.addEventListener('click', async()=>{ const uid=b.dataset.uid; try{ const d=await apiJson('/api/users/'+uid+'/links'); await navigator.clipboard.writeText(d.main_link||d.links[0]); toast(tr("link_copied")); }catch(e){toast(errorText(e.message));} }));
            tbody.querySelectorAll('[data-act="configs"]').forEach(b=> b.addEventListener('click', async()=>{ try{ await openSubConfigModal(b.dataset.uid, refreshUsers); }catch(e){toast(errorText(e.message));} }));
            tbody.querySelectorAll('[data-act="edit"]').forEach(b=> b.addEventListener('click', async()=>{ const uid=b.dataset.uid; try{ const u=await apiJson('/api/users/'+uid); await openUserModal(u); }catch(e){toast(errorText(e.message));} }));
            wireRowExtras(tbody, refreshUsers);
          }
          const cnt=usersSection.querySelector('.data-card .muted'); if(cnt) setText(cnt,'items_count',{n:users.length});
        }catch(e){ console.error(e); }
      }
      refreshUsers();
      document.addEventListener('titan:refresh', refreshUsers);
      if(search) search.addEventListener('input', ()=>{ const q=search.value.trim().toLowerCase(); if(!tbody) return; tbody.querySelectorAll('tr').forEach(tr=> tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none'); });
      const addBtn=usersSection.querySelector('.section-btn.primary'); if(addBtn) addBtn.onclick=()=> openUserModal();
      // remove old demo handlers that showed "✓ انجام شد"
      $$('button',usersSection).forEach(b=>{ if(b.dataset.demo) b.removeAttribute('data-demo'); });
    }

    const configsSection=document.querySelector('.section-view[data-section="configs"]');
    if(configsSection){
      const tbody=configsSection.querySelector('.data-table tbody');
      async function refreshConfigs(){
        try{
          const [uRes,nRes]=await Promise.all([apiJson('/api/users'), apiJson('/api/nodes')]);
          const users=uRes.users||[]; const nodes=nRes.nodes||[]; const nodeMap={}; nodes.forEach(n=>nodeMap[n.id]=n);
          // update top 3 cards
          const cards=configsSection.querySelectorAll('.section-grid .detail-card');
          if(cards[0]){
            const total=users.length; const active=users.filter(u=>u.enabled && !(u.status&&u.status.expired)).length;
            cards[0].innerHTML=`<h3>${uiText("stat_configs")}</h3><div class="metric-row"><span>${uiText("total_configs")}</span><strong>${total}</strong></div><div class="metric-row"><span>${uiText("enabled")}</span><strong>${active}</strong></div><div class="metric-row"><span>${uiText("expired")}</span><strong>${total-active}</strong></div>`;
          }
          if(cards[1]){
            const prots={}; users.forEach(u=> prots[u.protocol]=(prots[u.protocol]||0)+1);
            cards[1].innerHTML=`<h3>${uiText("protocols_used")}</h3>`+Object.entries(prots).map(([k,v])=>`<div class="metric-row"><span>${esc(k.toUpperCase())}</span><span class="pill">${v} ${uiText("items_unit",{n:v})}</span></div>`).join('') + (Object.keys(prots).length===0?`<div class="metric-row"><span class="muted">${uiText("no_items")}</span></div>`:'');
          }
          if(tbody){
            tbody.innerHTML=users.length? users.map(u=>{
              const n=nodeMap[u.node_id||1]; const loc=n?nodePlace(n):tr('unknown'); const flag=nodeFlag(n||{});
              const st=u.status||{}; const statusKey=st.expired?'expired':(!u.enabled?'rep_disabled':'enabled'); const cls=st.expired?'warn':(!u.enabled?'off':'');
              const on = !!u.enabled && !(st.expired);
              const port = (u.main_link||'').split('@')[1] ? (u.main_link||'').split('@')[1].split('/')[0] : '—';
              return `<tr><td><span class="user-cell"><span class="avatar user-avatar"><img src="${esc(u.avatar_url||'/static/img/titan-avatar.svg')}" alt=""></span>${esc(u.name)}</span></td><td>${esc((u.protocol||'').toUpperCase())} · ${esc((u.transport||'').toUpperCase())}</td><td>${flag} ${placeLabel(n||{})}</td><td dir="ltr" class="muted">${esc(port)}</td><td><span class="pill ${cls}">${uiText(statusKey)}</span></td><td><div class="row-actions">${icoBtn({"data-uid":u.uid,"data-act":"edit"},"edit",tr("edit_config"),"gold")}${icoBtn({"data-uid":u.uid,"data-act":"links"},"link",tr("copy_connection"),"violet")}${icoBtn({"data-uid":u.uid,"data-act":"qr"},"qr",tr("qr_code"),"")}${icoBtn({"data-uid":u.uid,"data-act":"power","data-on":on?1:0},"power",on?tr("turn_off"):tr("turn_on"),on?"":"ok")}${icoBtn({"data-uid":u.uid,"data-act":"del"},"trash",tr("gallery_remove"),"danger")}</div></td></tr>`;
            }).join('') : `<tr><td colspan="6" style="text-align:center;color:#8586a8">${uiText("no_configs_plain")}</td></tr>`;
            tbody.querySelectorAll('[data-act="del"]').forEach(b=> b.addEventListener('click', async()=>{ const uid=b.dataset.uid; if(!confirm(tr("delete_config_confirm"))) return; try{ await apiJson('/api/users/'+uid,{method:'DELETE'}); toast(tr("deleted")); refreshConfigs(); loadOverview(); }catch(e){toast(errorText(e.message));} }));
            tbody.querySelectorAll('[data-act="links"]').forEach(b=> b.addEventListener('click', async()=>{ const uid=b.dataset.uid; try{ const d=await apiJson('/api/users/'+uid+'/links'); await navigator.clipboard.writeText(d.main_link||d.links[0]); toast(tr("link_copied")); }catch(e){toast(errorText(e.message));} }));
            tbody.querySelectorAll('[data-act="edit"]').forEach(b=> b.addEventListener('click', async()=>{ const uid=b.dataset.uid; try{ const u=await apiJson('/api/users/'+uid); await openUserModal(u); }catch(e){toast(errorText(e.message));} }));
            wireRowExtras(tbody, refreshConfigs);
          }
        }catch(e){ console.error(e); }
      }
      refreshConfigs();
      document.addEventListener('titan:refresh', refreshConfigs);
      const addBtn=configsSection.querySelector('.section-btn.primary'); if(addBtn) addBtn.onclick=()=> openUserModal();
      $$('button',configsSection).forEach(b=>{ if(b.dataset.demo) b.removeAttribute('data-demo'); });
    }

    const serversSection=document.querySelector('.section-view[data-section="servers"]');
    if(serversSection){
      async function refreshServers(){
        try{
          const d=await apiJson('/api/nodes'); const nodes=d.nodes||[];
          const grid=serversSection.querySelector('.section-grid');
          if(grid && grid.children.length>=3){
            // update 3 top cards with real data
            const total=nodes.length; const online=nodes.filter(n=>n.enabled && n.status&&n.status.online).length;
            grid.children[0].innerHTML=`<h3>${uiText("nodes_status")}</h3><div class="metric-row"><span>${uiText("total_servers")}</span><strong>${total}</strong></div><div class="metric-row"><span>${uiText("online")}</span><span class="pill">● ${online}</span></div><div class="metric-row"><span>${uiText("offline")}</span><span class="pill off">${total-online}</span></div>`;
            const avgLat = (()=>{ const v=nodes.map(n=>n.status&&n.status.latency_ms).filter(x=>x!=null); return v.length? Math.round(v.reduce((a,b)=>a+b,0)/v.length)+' ms' : '—'; })();
            grid.children[1].innerHTML=`<h3>${uiText("conn_health")}</h3><div class="metric-row"><span>${uiText("avg_ping")}</span><strong>${avgLat}</strong></div><div class="metric-row"><span>${uiText("stability")}</span><strong>${online===total&&total>0?'99.9%':'—'}</strong></div><div class="progress"><span style="width:${total?Math.round((online/total)*100):0}%"></span></div>`;
          }

          const pingClass=(on,lat)=> !on?'off' : (lat==null?'off':(lat<90?'good':(lat<200?'mid':'bad')));
          const ring=(on,lat)=>{
            const R=26, C=2*Math.PI*R;
            const pct= lat==null?0:Math.max(4,Math.min(100,100-Math.min(lat,400)/4));
            const col= !on?'rgba(255,255,255,.18)':(lat==null?'rgba(255,255,255,.18)':(lat<90?'#31dcb9':(lat<200?'#d9b55f':'#ff6b8a')));
            return `<div class="nl-dial-wrap"><svg class="ring" viewBox="0 0 68 68"><circle class="rg-bg" cx="34" cy="34" r="${R}"></circle>`+
                   `<circle class="rg-fg" cx="34" cy="34" r="${R}" stroke="${col}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C-(C*pct/100)).toFixed(1)}"></circle></svg>`+
                   `<div class="rg-txt" style="color:${col}">${lat!=null?lat:'—'}</div></div>`;
          };
          const bar=(k,v)=>{
            const n=(v==null?null:Math.max(0,Math.min(100,Math.round(v))));
            const cls= n==null?'':(n>=90?' hot':(n>=70?' warm':''));
            return `<div class="nl-metric${cls}"><div class="k">${k}</div><div class="v">${n!=null?n+'%':'—'}</div><div class="bar"><i style="width:${n||0}%"></i></div></div>`;
          };
          const seen=dateLabel;
          function nodeCaps(n,on){
            const st=n.status||{}; const caps=[];
            caps.push(`<span class="nl-cap ${on?'ok':'bad'}"><span class="dotm"></span>${uiText(on?"online":"offline")}</span>`);
            if(n.is_local) caps.push(`<span class="nl-cap warn"><span class="dotm"></span>${uiText("main_node")}</span>`);
            else if(n.enabled===false) caps.push(`<span class="nl-cap warn"><span class="dotm"></span>${uiText("maintenance_mode")}</span>`);
            const addr=(n.address||'').replace(/^https?:\/\//,'');
            if(addr) caps.push(`<span class="nl-cap" dir="ltr" title="${esc(addr)}">${icon('link',12,1.9)}${esc(addr.length>26?addr.slice(0,26)+'…':addr)}</span>`);
            if(n.edge && n.edge.port) caps.push(`<span class="nl-cap ${n.edge.measured?'ok':''}" dir="ltr">${uiText("edge")} ${esc(n.edge.scheme||'https')} :${esc(n.edge.port)}</span>`);
            const raw=n.raw_open||{};
            raw && Object.keys(raw).forEach(port=>{
              const open=raw[port]===true;
              caps.push(`<span class="nl-cap ${open?'ok':'bad'}" dir="ltr">${uiText("raw_port")} ${esc(port)} ${open?'✓':'✕'}</span>`);
            });
            const sync=n.sync;
            if(sync){
              if(sync.ok===true){
                const serv=(sync.serving||[]).length;
                const exp=sync.expected!=null?sync.expected:serv;
                const cred=sync.credential?(' · '+(sync.credential==='shared'?uiText('shared_secret'):uiText('token'))):'';
                caps.push(`<span class="nl-cap ok"><span class="dotm"></span>${uiText("sync")} ${serv}/${exp} ✓${cred}</span>`);
              } else if(sync.ok===false){
                caps.push(`<span class="nl-cap bad"><span class="dotm"></span>${uiText("sync")} ${esc(errorText(sync.error))}</span>`);
              }
            } else if(!st.online){
              caps.push(`<span class="nl-cap"><span class="dotm"></span>${uiText("sync_unknown")}</span>`);
            }
            return caps.join('');
          }
          function nodeCard(n){
            const st=n.status||{}; const on=!!(n.enabled!==false && st.online);
            const lat=(st.latency_ms!=null?Number(st.latency_ms):null);
            const flag=nodeFlag(n);
            const city=(n.city && n.city!=='—')?n.city:'';
            const sync=n.sync||{}; const stale=(sync.ok===true && sync.at && (Date.now()/1000 - sync.at)>900);
            const note = !on ? `${uiText("last_contact")} ${seen(n.last_seen)}${st.reason?' · '+esc(errorText(st.reason)):''}`
                        : (sync.ok===false ? `${uiText("sync_failed_open")}${esc(errorText(sync.error))}${uiText("node_sync_help")}`
                        : (stale ? `${uiText("sync_stale_open")}${seen(sync.at)}${uiText("node_sync_again")}`
                        : (sync.ok===true ? '' : tr("sync_not_measured"))));
            return `<article class="node-lux ${on?'':'offline'}${n.is_local?' local':''}" data-node="${n.id}">
              <div class="nl-top">
                <div class="nl-medal"><span class="fe">${flag}</span></div>
                <div style="flex:1;min-width:0">
                  <div class="nl-name"><span class="nl-orb ${on?'':'off'}"></span>${nodeNameLabel(n)}</div>
                  <div class="nl-loc">${placeLabel(n)}${city?' · '+esc(city):''}</div>
                </div>
                <span class="pill ${on?'':'off'}">${uiText(on?"online":"offline")}</span>
              </div>
              <div class="nl-dial">${ring(on,lat)}
                <div><div class="nl-dial-val">${lat!=null?lat+' ms':'—'}</div><div class="nl-dial-lbl">${uiText("latency")}</div></div>
              </div>
              <div class="nl-caps">${nodeCaps(n,on)}</div>
              <div class="nl-metrics">${bar('CPU',st.cpu)}${bar('RAM',st.ram)}${bar('DISK',st.disk)}</div>
              <div class="nl-meta">
                <span>${uiText("version_label")} <b>${esc(st.version||'—')}</b></span>
                <span>${uiText("users_on_node")} <b>${sync.on_node!=null?esc(sync.on_node):'—'}</b></span>
                <span>${uiText("uptime_label")} <b>${st.uptime?esc(String(st.uptime)):'—'}</b></span>
              </div>
              ${note?`<div class="nl-note${(sync.ok===false&&on)?' bad':''}">${note}</div>`:''}
              <div class="nl-actions">
                ${icoBtn({'data-id':n.id,'data-act':'ping'},'pulse',tr("ping"))}
                ${icoBtn({'data-id':n.id,'data-act':'claim'},'bolt',tr("node_claim"),'gold')}
                ${icoBtn({'data-id':n.id,'data-act':'sync'},'sync',tr("node_sync_now"),'violet')}
                ${icoBtn({'data-id':n.id,'data-act':'edit'},'edit',tr("edit_node"),'gold')}
                <span class="spacer"></span>
                ${n.is_local?'':icoBtn({'data-id':n.id,'data-act':'toggle'},'power',n.enabled===false?tr("exit_maintenance"):tr("maintenance_mode"),n.enabled===false?'ok':'')}
                ${n.is_local?'':icoBtn({'data-id':n.id,'data-act':'del'},'trash',tr("delete_node"),'danger')}
              </div>
            </article>`;
          }
          let grid2=serversSection.querySelector('.node-grid');
          if(!grid2){
            grid2=document.createElement('div'); grid2.className='node-grid'; grid2.id='nodeGrid';
            serversSection.appendChild(grid2);
          }
          grid2.innerHTML=nodes.length? nodes.map(nodeCard).join('')
            : `<div class="detail-card" style="grid-column:1/-1"><div class="metric-row"><span class="muted">${uiText("no_nodes_add_hint")}</span></div></div>`;
          grid2.querySelectorAll('[data-act]').forEach(b=> b.addEventListener('click', async()=>{
            const id=b.dataset.id; const act=b.dataset.act;
            if(act==='ping'){
              b.disabled=true;
              try{ await apiJson('/api/nodes/'+id+'/ping',{method:'POST'}); toast(tr("checked")); refreshServers(); loadOverview(); }
              catch(e){ toast(errorText(e.message)); } finally{ b.disabled=false; }
            } else if(act==='claim'){
              b.disabled=true;
              try{
                const res=await apiJson('/api/nodes/'+id+'/claim',{method:'POST'});
                const st=res.node_sync||{};
                if(st.ok) toast(tr("node_detected_synced"));
                else { toast(tr("node_connect_failed")); openNodeSetupModal({setup:{...(window.__titanSetup||{})}, sync_now:st}); }
                refreshServers(); loadOverview();
              }catch(e){ toast(errorText(e.message)); } finally{ b.disabled=false; }
            } else if(act==='sync'){
              b.disabled=true;
              try{ await apiJson('/api/nodes/'+id+'/sync',{method:'POST'}); toast(tr("node_synced")); refreshServers(); }
              catch(e){ toast(errorText(e.message)); } finally{ b.disabled=false; }
            } else if(act==='edit'){
              try{ const n=(await apiJson('/api/nodes')).nodes.find(x=>String(x.id)===String(id)); if(n) await openNodeModal(n); }
              catch(e){ toast(errorText(e.message)); }
            } else if(act==='toggle'){
              try{
                const cur=(await apiJson('/api/nodes')).nodes.find(x=>String(x.id)===String(id));
                await apiJson('/api/nodes/'+id,{method:'PATCH',body:{enabled:!(cur&&cur.enabled)}});
                toast(cur&&cur.enabled?tr("entered_maintenance"):tr("left_maintenance")); refreshServers(); loadOverview();
              }catch(e){ toast(errorText(e.message)); }
            } else if(act==='del'){
              if(!confirm(tr("delete_server_confirm"))) return;
              try{ await apiJson('/api/nodes/'+id,{method:'DELETE'}); toast(tr("deleted")); refreshServers(); loadOverview(); }
              catch(e){ toast(errorText(e.message)); }
            }
          }));
        }catch(e){ console.error(e); }
      }
      refreshServers();
      document.addEventListener('titan:refresh', refreshServers);
      const addBtn=serversSection.querySelector('.section-btn.primary'); if(addBtn) addBtn.onclick=()=> openNodeModal();

      const advBtn=serversSection.querySelector('.section-head .section-btn:not(.primary)');
      if(advBtn){ advBtn.setAttribute('data-act','advisor'); advBtn.onclick=()=> openLatencyAdvisor(); }
      $$('button',serversSection).forEach(b=>{ if(b.dataset.demo) b.removeAttribute('data-demo'); });
    }

    const subsSection=document.querySelector('.section-view[data-section="subscriptions"]');
    if(subsSection){
      // The tab lists *links*, not users: each row is a subscription the admin
      // built (name + token + the exact configs it carries).
      async function refreshSubs(){
        try{
          const d=await apiJson('/api/subscriptions'); const subs=d.subscriptions||[];
          const tbody=subsSection.querySelector('.data-table tbody');
          if(tbody){
            tbody.innerHTML=subs.length? subs.map(sb=>{
              const on=!!sb.enabled;
              const seen=dateLabel(sb.last_used);
              // the picture the page shows: the link's own, else its user's, else TiTaN
              const pic='/s/'+esc(sb.token)+'/avatar';
              return `<tr><td><span class="user-cell"><span class="avatar user-avatar sub-medal" data-sub="${esc(sb.id)}" data-act="pic" role="button" tabindex="0" data-i18n-tip="sub_page_picture" data-tip="${tr("sub_page_picture")}" data-i18n-aria="sub_picture" aria-label="${tr("sub_picture")}"><img src="${pic}" alt=""></span>${esc(sb.name)}</span><span class="sub-token muted" dir="ltr">…${esc((sb.token||'').slice(-6))}</span></td>`
                +`<td><span class="pill ${on?'':'off'}">${uiText(on?"enabled":"rep_disabled")}</span></td>`
                +`<td><span class="sub-count">${sb.users||0}</span> ${uiText("users_unit",{n:sb.users||0})}</td>`
                +`<td><span class="sub-count">${sb.configs||0}</span> ${uiText("configs_unit",{n:sb.configs||0})}</td>`
                +`<td class="muted">${sb.hits||0} ${uiText("hits_suffix")} ${seen}</td>`
                +`<td><div class="row-actions">${icoBtn({"data-sub":sb.id,"data-act":"manage"},"sliders",tr("manage_sub_configs"),"gold")}`
                +`${icoBtn({"data-sub":sb.id,"data-act":"copy"},"copy",tr("copy_sub_client"),"violet")}`
                +`${icoBtn({"data-sub":sb.id,"data-act":"page"},"dashboard",tr("copy_sub_page"),"")}`
                +`${icoBtn({"data-sub":sb.id,"data-act":"pic"},"image",tr("sub_page_picture"),"violet")}`
                +`${icoBtn({"data-sub":sb.id,"data-act":"qr"},"qr",tr("sub_qr"),"")}`
                +`${icoBtn({"data-sub":sb.id,"data-act":"power","data-on":on?1:0},"power",on?tr("disable"):tr("enable"),on?'':'ok')}`
                +`${icoBtn({"data-sub":sb.id,"data-act":"del"},"trash",tr("delete_link"),"danger")}</div></td></tr>`
            }).join('') : `<tr><td colspan="6" style="text-align:center;color:#8586a8">${uiText("no_sub_links_hint")}</td></tr>`;
            const find=async(id)=>{ const list=(await apiJson('/api/subscriptions')).subscriptions||[]; return list.find(s=>String(s.id)===String(id)); };
            tbody.querySelectorAll('[data-act="manage"]').forEach(b=> b.addEventListener('click', async()=>{
              try{ const sb=await find(b.dataset.sub); await openSubBuilder(sb, refreshSubs); }catch(e){ toast(errorText(e.message)); }
            }));
            tbody.querySelectorAll('[data-act="copy"]').forEach(b=> b.addEventListener('click', async()=>{
              try{ const sb=await find(b.dataset.sub); await navigator.clipboard.writeText(sb.url); toast(tr("link_copied")); }catch(e){ toast(errorText(e.message)); }
            }));
            tbody.querySelectorAll('[data-act="qr"]').forEach(b=> b.addEventListener('click', ()=>{
              window.open('/api/subscriptions/'+b.dataset.sub+'/qr','_blank');
            }));
            tbody.querySelectorAll('[data-act="page"]').forEach(b=> b.addEventListener('click', async()=>{
              try{ const sb=await find(b.dataset.sub); await navigator.clipboard.writeText(sb.page_url||('location.origin'+'/p/'+sb.token)); toast(tr("sub_page_copied")); }
              catch(e){ toast(errorText(e.message)); }
            }));
            const pickSubPic=async(id)=>{
              try{
                const sb=await find(id);
                const k=await openGalleryPicker((sb&&sb.avatar)||'');
                if(k==null) return;
                await apiJson('/api/subscriptions/'+id,{method:'PATCH',body:{avatar:k}});
                toast(k?tr("sub_picture_saved"):tr("sub_picture_removed"));
                refreshSubs();
              }catch(e){ toast(errorText(e.message)); }
            };
            tbody.querySelectorAll('[data-act="pic"]').forEach(b=> b.addEventListener('click', ()=>pickSubPic(b.dataset.sub)));
            tbody.querySelectorAll('[data-act="pic"]').forEach(b=> b.addEventListener('keydown', (e)=>{
              if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pickSubPic(b.dataset.sub); }
            }));
            tbody.querySelectorAll('[data-act="power"]').forEach(b=> b.addEventListener('click', async()=>{
              const on=b.dataset.on==='1'; b.disabled=true;
              try{ await apiJson('/api/subscriptions/'+b.dataset.sub,{method:'PATCH',body:{enabled:!on}}); toast(on?tr("link_disabled"):tr("link_enabled")); refreshSubs(); }
              catch(e){ toast(errorText(e.message)); } finally{ b.disabled=false; }
            }));
            tbody.querySelectorAll('[data-act="del"]').forEach(b=> b.addEventListener('click', async()=>{
              if(!confirm(tr("sub_delete_confirm"))) return;
              try{ await apiJson('/api/subscriptions/'+b.dataset.sub,{method:'DELETE'}); toast(tr("deleted")); refreshSubs(); }catch(e){ toast(errorText(e.message)); }
            }));
          }
        }catch(e){ console.error(e); }
      }
      refreshSubs(); document.addEventListener('titan:refresh', refreshSubs);
      const newSubBtn=subsSection.querySelector('.section-head .section-btn.primary');
      if(newSubBtn) newSubBtn.onclick=()=> openSubBuilder(null, refreshSubs);
    }
    const reportsSection=document.querySelector('.section-view[data-section="reports"]');
    if(reportsSection){
      async function refreshReports(){
        try{
          const r=await apiJson('/api/reports?days=7');
          const t=r.totals||{}; const prots=r.protocols||[]; const daily=r.daily||[];
          const grid=reportsSection.querySelector('.section-grid');
          if(grid && grid.children.length>=3){
            grid.children[0].innerHTML=`<h3>${uiText("traffic_usage")}</h3><div class="metric-row"><span>${uiText("chart_download")}</span><strong>${esc(fmtBytes(t.total_down||0))}</strong></div><div class="metric-row"><span>${uiText("chart_upload")}</span><strong>${esc(fmtBytes(t.total_up||0))}</strong></div><div class="progress"><span style="width:${Math.min(100, Math.round(((t.total_up+t.total_down)/(1024*1024*1024))*10))}%"></span></div>`;
            grid.children[1].innerHTML=`<h3>${uiText("user_growth")}</h3><div class="metric-row"><span>${uiText("all_total")}</span><strong>${t.users||0}</strong></div><div class="metric-row"><span>${uiText("enabled")}</span><strong>${t.active||0}</strong></div><div class="metric-row"><span>${uiText("expired")}</span><strong>${t.expired||0}</strong></div>`;
            grid.children[2].innerHTML=`<h3>${uiText("system_events")}</h3><div class="metric-row"><span>${uiText("rep_active")}</span><strong>${t.active||0}</strong></div><div class="metric-row"><span>${uiText("rep_disabled")}</span><strong>${t.disabled||0}</strong></div><div class="metric-row"><span>${uiText("protocols")}</span><strong>${prots.length}</strong></div>`;
          }
          // chart-mini
          const chartMini=reportsSection.querySelector('.chart-mini');
          if(chartMini && daily.length){
            const max=Math.max(1, ...daily.map(d=> (d.up||0)+(d.down||0)));
            chartMini.innerHTML=daily.map(d=>{
              const h=Math.max(8, Math.round(((d.up+d.down)/max)*100));
              return `<span style="height:${h}%" title="${esc(fmtBytes(d.up+d.down))}"></span>`;
            }).join('');
            const totEl=reportsSection.querySelector('.chart-mini + .metric-row strong');
            if(totEl) totEl.textContent=tr("total_prefix")+fmtBytes(daily.reduce((a,d)=>a+d.up+d.down,0));
          }
          // keep "آخرین رویدادها" table as static events; top_users is shown in chart tooltip, not overwriting events
          // (if needed, could render top users elsewhere without destroying real event log)
        }catch(e){ console.error(e); }
      }
      refreshReports(); document.addEventListener('titan:refresh', refreshReports);
      // remove demo handlers
      $$('button',reportsSection).forEach(b=>{ if(b.dataset.demo) b.removeAttribute('data-demo'); });
    }

    const settingsSection=document.querySelector('.section-view[data-section="settings"]');
    if(settingsSection){
      // IDs keep form bindings independent of the selected language.
      const publicDomain = $('#set_public_domain', settingsSection);
      const publicPort = $('#set_public_port', settingsSection);
      const saveBtn = $('#set_save', settingsSection);
      const oldPass = $('#set_old_password', settingsSection);
      const newPass = $('#set_new_password', settingsSection);
      const changeBtn = $('#set_change_password', settingsSection);
      const transportSel = $('#set_transport', settingsSection);
      const fpSel = $('#set_fp', settingsSection);
      const alpnIn = $('#set_alpn', settingsSection);
      const sniIn = $('#set_sni', settingsSection);
      const fragLen = $('#set_frag_len', settingsSection);
      const fragInt = $('#set_frag_int', settingsSection);
      const backupInt = $('#set_backup_interval', settingsSection);
      const languageSelect = $('#set_lang', settingsSection);
      if (languageSelect) {
        languageSelect.value = I18N.lang;
        languageSelect.onchange = () => I18N.setLang(languageSelect.value);
      }

      async function loadSettings(){
        try{
          const s=await apiJson('/api/settings');
          if(publicDomain) publicDomain.value=s.public_domain||'';
          if(publicPort) publicPort.value=s.public_port||'443';
          if(transportSel && s.default_transport) transportSel.value=s.default_transport.toUpperCase();
          if(fpSel && s.default_fingerprint) fpSel.value=s.default_fingerprint;
          if(alpnIn) alpnIn.value=s.default_alpn||'http/1.1';
          if(sniIn) sniIn.value=s.sni_override||'';
          $$('[data-setting]',settingsSection).forEach(row=>{
            const sw=row.querySelector('.switch');
            if(sw){
              sw.classList.toggle('on', !!s[row.dataset.setting]);
              sw.onclick=()=>sw.classList.toggle('on');
            }
          });
          if(fragLen) fragLen.value=s.fragment_length||'10-30';
          if(fragInt) fragInt.value=s.fragment_interval||'10-20';
          if(backupInt) backupInt.value=s.backup_interval_hours||24;
          // update notice about password
          const notice=settingsSection.querySelector('.notice');
          if(notice){
            const me=await apiJson('/api/me').catch(()=>null);
            if(me && !me.default_auth) notice.style.display='none';
            else notice.style.display='block';
          }
        }catch(e){ console.error(e); }
      }
      loadSettings();
      if(saveBtn) saveBtn.onclick=async()=>{
        const body={};
        if(publicDomain) body.public_domain=publicDomain.value.trim();
        if(publicPort) body.public_port=publicPort.value.trim();
        if(transportSel) body.default_transport=(transportSel.value||'ws').toLowerCase();
        if(fpSel) body.default_fingerprint=fpSel.value;
        if(alpnIn) body.default_alpn=alpnIn.value;
        if(sniIn) body.sni_override=sniIn.value.trim();
        $$('[data-setting]',settingsSection).forEach(row=>{
          const sw=row.querySelector('.switch');
          if(sw) body[row.dataset.setting]=sw.classList.contains('on');
        });
        if(fragLen) body.fragment_length=fragLen.value;
        if(fragInt) body.fragment_interval=fragInt.value;
        if(backupInt) body.backup_interval_hours=parseInt(backupInt.value)||24;

        try{ await apiJson('/api/settings',{method:'POST',body}); toast(tr("settings_saved")); }
        catch(e){ toast(errorText(e.message)); }
      };
      if(changeBtn) changeBtn.onclick=async()=>{
        const oldV=oldPass?oldPass.value:''; const newV=newPass?newPass.value:'';
        if(!newV || newV.length<6){ toast(tr("password_min_length")); return; }
        try{ await apiJson('/api/change-password',{method:'POST',body:{old_password:oldV,new_password:newV}}); toast(tr("password_changed")); if(oldPass) oldPass.value=''; if(newPass) newPass.value=''; }
        catch(e){ toast(e.message==='wrong-old-password'?tr("wrong_password_current"):e.message); }
      };
      const dlBtn=$('#set_backup_download',settingsSection);
      if(dlBtn) dlBtn.onclick=()=>{ location.href='/api/backup'; };
      const restoreBtn=$('#set_backup_restore',settingsSection);
      if(restoreBtn) restoreBtn.onclick=()=>{
        const inp=document.createElement('input'); inp.type='file'; inp.accept='.b64,.gz';
        inp.onchange=async()=>{
          const file=inp.files[0]; if(!file) return; if(!confirm(tr("restore_backup_confirm"))) return;
          const fd=new FormData(); fd.append('file',file);
          try{ const r=await fetch('/api/backup/restore',{method:'POST',body:fd,credentials:'same-origin'}); const d=await r.json().catch(()=>({})); if(r.ok) toast(tr("restored")); else toast(errorText(d.detail)); }catch(e){ toast(errorText(e.message)); }
        };
        inp.click();
      };
      const restartBtn=settingsSection.querySelector('.danger-btn');
      if(restartBtn) restartBtn.onclick=async()=>{ if(!confirm(tr("restart_panel_confirm"))) return; try{ await apiJson('/api/restart',{method:'POST'}); toast(tr("restarting")); }catch(e){ toast(errorText(e.message)); } };
      // avatar in settings
      const avatarBtn=$('#set_avatar_pick',settingsSection);
      if(avatarBtn) avatarBtn.onclick=async()=>{
        const me=await apiJson('/api/me').catch(()=>null);
        const cur=me&&me.avatar?me.avatar.key:'';
        const k=await openGalleryPicker(cur);
        if(k==null) return;
        try{ await apiJson('/api/admin-avatar',{method:'POST',body:{avatar:k}}); toast(tr("picture_saved")); loadMe(); }
        catch(e){ toast(errorText(e.message)); }
      };
      $$('button',settingsSection).forEach(b=>{ if(b.dataset.demo) b.removeAttribute('data-demo'); });
    }

    const adminsSection=document.querySelector('.section-view[data-section="admins"]');
    if(adminsSection){
      async function refreshAdmins(){
        try{
          const info=await apiJson('/api/admin-info');
          // update avatar in the table
          const imgs=adminsSection.querySelectorAll('.avatar img');
          imgs.forEach(img=>{ if(info.avatar&&info.avatar.url) img.src=info.avatar.url; });
          const nameCell=adminsSection.querySelector('.data-table tbody td');
          if(nameCell && info.username) nameCell.textContent=info.username;
        }catch(e){}
      }
      refreshAdmins(); document.addEventListener('titan:refresh', refreshAdmins);
    }

    const toolsSection=document.querySelector('.section-view[data-section="tools"]');
    if(toolsSection){
      const testBtn=$('#tools_conn_test',toolsSection);
      if(testBtn) testBtn.onclick=async()=>{
        testBtn.disabled=true; const old=testBtn.textContent; testBtn.textContent=tr("testing");
        try{ const r=await apiJson('/api/connection-test'); toast('Xray: '+(r.xray_running?tr("enabled"):tr("rep_disabled"))+' - WS: '+(r.internal_ports_open&&r.internal_ports_open['vless-ws']?'ok':'fail')); }catch(e){ toast(errorText(e.message)); } finally{ testBtn.disabled=false; testBtn.textContent=old; }
      };
      $$('button',toolsSection).forEach(b=>{ if(b.dataset.demo) b.removeAttribute('data-demo'); });
    }
  }

  // --- header & sidebar wiring ---
  document.addEventListener('DOMContentLoaded', ()=>{
    loadMe(); loadOverview(); setTimeout(wireDetails, 400);
    const labelTables=()=>{
      $$('.data-table').forEach(table=>{
        const headings=$$('thead th',table).map(th=>th.textContent.trim());
        $$('tbody tr',table).forEach(row=>{
          $$('td',row).forEach((cell,index)=>cell.setAttribute('data-label',headings[index]||''));
        });
      });
    };
    labelTables();
    if(typeof MutationObserver!=='undefined'){
      const tables=new MutationObserver(labelTables);
      tables.observe($('#sectionViews')||document.body,{childList:true,subtree:true,characterData:true});
    }
    document.addEventListener('titan:lang',()=>{
      loadMe(); loadOverview();
      document.dispatchEvent(new Event('titan:refresh'));
      const select=$('#set_lang'); if(select) select.value=I18N.lang;
      $$('[data-date-ts]').forEach(el=>el.textContent=new Date(Number(el.dataset.dateTs)*1000).toLocaleString(I18N.locale,el.dataset.dateFormat==='short'?{month:'short',day:'numeric'}:{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}));
      toastEl.style.opacity='0';
    });

    const gSearch=document.querySelector('.search input[type="search"]');
    if(gSearch){
      gSearch.addEventListener('input', ()=>{
        const q=gSearch.value.trim().toLowerCase();
        $$('.recent-table-row').forEach(r=> r.style.display=r.textContent.toLowerCase().includes(q)?'':'none');
      });
      document.addEventListener('keydown', e=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); gSearch.focus(); } });
    }
    const refreshBtn=document.querySelectorAll('.action')[1];
    if(refreshBtn) refreshBtn.onclick=()=>{ loadOverview(); toast(tr("refreshed")); };

    // profile: click avatar -> change picture (not just logout)
    const prof=document.querySelector('.header .profile');
    const profAv=document.querySelector('.header .profile .avatar');
    if(profAv){
      profAv.style.cursor='pointer';
      profAv.setAttribute('data-i18n-tip','change_profile_picture');
      profAv.title=tr('change_profile_picture');
      profAv.onclick=async (e)=>{
        e.stopPropagation();
        try{
          const me=await apiJson('/api/me');
          const cur=me.avatar?me.avatar.key:'';
          const k=await openGalleryPicker(cur);
          if(k==null) return;
          await apiJson('/api/admin-avatar',{method:'POST',body:{avatar:k}});
          toast(tr("avatar_saved"));
          loadMe();
        }catch(err){ toast(errorText(err.message)); }
      };
    }
    // profile container click -> show menu with avatar change + logout
    if(prof){
      // add a small logout icon next to profile if not exists
      if(!$('#headerLogout')){
        const lo=document.createElement('button');
        lo.id='headerLogout';
        lo.setAttribute('data-i18n-tip','logout');
        lo.title=tr('logout');
        lo.style.cssText='width:32px;height:32px;border-radius:9px;border:1px solid rgba(151,116,255,.18);background:rgba(91,49,176,.1);color:#c5c5df;display:grid;place-items:center;cursor:pointer;margin-right:6px';
        lo.innerHTML='<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7"><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/></svg>';
        lo.onclick=async()=>{
          if(confirm(tr("logout_confirm"))){
            try{ localStorage.removeItem('titan_token'); }catch(e){}
            try{ await apiJson('/api/logout',{method:'POST'}); location.href='/login'; }catch(e){ location.href='/login'; }
          }
        };
        const actions=document.querySelector('.actions');
        if(actions) actions.appendChild(lo);
      }
    }
    const ver=document.querySelector('.version');
    if(ver) ver.onclick=()=> toast(tr('panel_name'));

    // sidebar version avatar also clickable to change
    const verLogo=document.querySelector('.version-logo');
    if(verLogo){
      verLogo.style.cursor='pointer';
      verLogo.onclick=async()=>{
        try{
          const me=await apiJson('/api/me');
          const cur=me.avatar?me.avatar.key:'';
          const k=await openGalleryPicker(cur);
          if(k!=null){ await apiJson('/api/admin-avatar',{method:'POST',body:{avatar:k}}); toast(tr("picture_saved")); loadMe(); }
        }catch(e){ toast(errorText(e.message)); }
      };
    }

    function handleHash(){
      const h=location.hash||'';
      const map={'#/dashboard':0,'#/users':1,'#/configs':2,'#/nodes':3,'#/subscriptions':4,'#/reports':5,'#/settings':6,'#/admins':7,'#/tools':8};
      const idx=map[h];
      if(idx!=null){ const nav=document.querySelectorAll('.nav-item'); if(nav[idx]) nav[idx].click(); }
    }
    window.addEventListener('hashchange', handleHash); handleHash();
  });

  window._titanRefresh=()=>{ loadOverview(); document.dispatchEvent(new Event('titan:refresh')); };
})();
