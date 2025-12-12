/* app.js - Simulação de backend via localStorage
   Fornece: autenticação simples, CRUD hóspedes, quartos e reservas
*/
(function(){
  const DB = {
    users: 'sh_users',
    auth: 'sh_auth',
    guests: 'sh_guests',
    rooms: 'sh_rooms',
    reservations: 'sh_reservations'
  };

  function read(key, fallback){
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  }
  function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  // seeded data
  function seed(){
    if(!localStorage.getItem(DB.users)){
      write(DB.users, [
        {id:1,name:'Admin',email:'admin@hotel',password:'123456'}
      ]);
    }
    if(!localStorage.getItem(DB.rooms)){
      write(DB.rooms, [
        {id:1,title:'Quarto Luxo',price:420,meta:'Cama king, vista'},
        {id:2,title:'Suíte Executiva',price:360,meta:'Workspace e amenidades'},
        {id:3,title:'Standard Confort',price:220,meta:'Essencial e confortável'}
      ]);
    }
    if(!localStorage.getItem(DB.guests)) write(DB.guests, []);
    if(!localStorage.getItem(DB.reservations)) write(DB.reservations, []);
  }

  /* Authentication */
  function login(email,password){
    const users = read(DB.users,[]);
    const u = users.find(x=>x.email===email && x.password===password);
    if(u){ write(DB.auth,{id:u.id,email:u.email,name:u.name}); return {ok:true,user:u}; }
    return {ok:false,msg:'Usuário ou senha inválidos.'};
  }
  function logout(){ localStorage.removeItem(DB.auth); location.href='login.html'; }
  function currentUser(){ return read(DB.auth,null); }
  function requireAuth(){ if(!currentUser()) location.href='login.html'; }

  /* Users (registration) */
  function registerUser(name,email,password){
    const users = read(DB.users,[]);
    if(users.find(u=>u.email===email)) return {ok:false,msg:'E-mail já cadastrado'};
    const id = users.length? Math.max(...users.map(u=>u.id))+1 : 1;
    users.push({id,name,email,password}); write(DB.users,users); return {ok:true};
  }

  /* Guests CRUD */
  function listGuests(){ return read(DB.guests,[]); }
  function addGuest(obj){ const arr=listGuests(); obj.id = arr.length?Math.max(...arr.map(x=>x.id))+1:1; arr.push(obj); write(DB.guests,arr); return obj; }
  function updateGuest(id,patch){ const arr=listGuests(); const i=arr.findIndex(x=>x.id==id); if(i===-1) return null; arr[i]=Object.assign(arr[i],patch); write(DB.guests,arr); return arr[i]; }
  function deleteGuest(id){ let arr=listGuests(); arr=arr.filter(x=>x.id!=id); write(DB.guests,arr); }

  /* Rooms CRUD */
  function listRooms(){ return read(DB.rooms,[]); }
  function addRoom(obj){ const arr=listRooms(); obj.id = arr.length?Math.max(...arr.map(x=>x.id))+1:1; arr.push(obj); write(DB.rooms,arr); return obj; }
  function updateRoom(id,patch){ const arr=listRooms(); const i=arr.findIndex(x=>x.id==id); if(i===-1) return null; arr[i]=Object.assign(arr[i],patch); write(DB.rooms,arr); return arr[i]; }
  function deleteRoom(id){ let arr=listRooms(); arr=arr.filter(x=>x.id!=id); write(DB.rooms,arr); }

  /* Reservations */
  function listReservations(){ return read(DB.reservations,[]); }
  function addReservation(obj){ const arr=listReservations(); obj.id = arr.length?Math.max(...arr.map(x=>x.id))+1:1; arr.push(obj); write(DB.reservations,arr); return obj; }
  function updateReservation(id,patch){ const arr=listReservations(); const i=arr.findIndex(x=>x.id==id); if(i===-1) return null; arr[i]=Object.assign(arr[i],patch); write(DB.reservations,arr); return arr[i]; }
  function deleteReservation(id){ let arr=listReservations(); arr=arr.filter(x=>x.id!=id); write(DB.reservations,arr); }

  /* UI initializers for each page */
  function initLogin(){
    seed();
    const form = document.getElementById('loginForm');
    if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      const res = login(email,password);
      if(res.ok) location.href='dashboard.html'; else alert(res.msg);
    });
  }

  function initRegister(){
    seed();
    const form = document.getElementById('registerForm');
    if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name=form.name.value.trim(), email=form.email.value.trim(), pwd=form.password.value;
      const r = registerUser(name,email,pwd);
      if(r.ok){ alert('Cadastro realizado. Faça login.'); location.href='login.html'; } else alert(r.msg);
    });
  }

  function initDashboard(){ requireAuth(); const user = currentUser();
    document.getElementById('who').textContent = user.name || user.email;
    document.getElementById('logoutBtn').addEventListener('click', logout);
  }

  function renderGuestsTable(){ const list = listGuests(); const tbody=document.getElementById('guestsBody'); if(!tbody) return; tbody.innerHTML='';
    list.forEach(g=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${g.id}</td><td>${g.name}</td><td>${g.email||''}</td><td>${g.phone||''}</td><td><button data-id="${g.id}" class="edit">Editar</button> <button data-id="${g.id}" class="del">Excluir</button></td>`; tbody.appendChild(tr); });
    tbody.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',e=>{
      const id=+e.target.dataset.id; const g = listGuests().find(x=>x.id==id); if(!g) return; document.getElementById('guestId').value=g.id; document.getElementById('guestName').value=g.name; document.getElementById('guestEmail').value=g.email||''; document.getElementById('guestPhone').value=g.phone||'';
    }));
    tbody.querySelectorAll('.del').forEach(b=>b.addEventListener('click',e=>{ if(!confirm('Excluir hóspede?')) return; deleteGuest(+e.target.dataset.id); renderGuestsTable(); }));
  }

  function initGuests(){ requireAuth(); renderGuestsTable();
    const form = document.getElementById('guestForm'); if(!form) return;
    form.addEventListener('submit', e=>{ e.preventDefault(); const id = +form.guestId.value; const data = {name:form.guestName.value.trim(), email:form.guestEmail.value.trim(), phone:form.guestPhone.value.trim()}; if(id){ updateGuest(id,data); form.reset(); } else { addGuest(data); form.reset(); } renderGuestsTable(); });
  }

  function renderRooms(){ const list=listRooms(); const tbody=document.getElementById('roomsBody'); if(!tbody) return; tbody.innerHTML=''; list.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.id}</td><td>${r.title}</td><td>R$ ${r.price}</td><td>${r.meta||''}</td><td><button data-id="${r.id}" class="edit">Editar</button> <button data-id="${r.id}" class="del">Excluir</button></td>`; tbody.appendChild(tr); });
    tbody.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',e=>{ const id=+e.target.dataset.id; const r=listRooms().find(x=>x.id==id); document.getElementById('roomId').value=r.id; document.getElementById('roomTitle').value=r.title; document.getElementById('roomPrice').value=r.price; document.getElementById('roomMeta').value=r.meta||''; }));
    tbody.querySelectorAll('.del').forEach(b=>b.addEventListener('click',e=>{ if(!confirm('Excluir quarto?')) return; deleteRoom(+e.target.dataset.id); renderRooms(); }));
  }

  function initRooms(){ requireAuth(); renderRooms(); const form=document.getElementById('roomForm'); if(!form) return; form.addEventListener('submit',e=>{ e.preventDefault(); const id=+form.roomId.value; const data={title:form.roomTitle.value.trim(), price: +form.roomPrice.value, meta:form.roomMeta.value.trim()}; if(id) updateRoom(id,data); else addRoom(data); form.reset(); renderRooms(); }); }

  function renderReservations(){ const list=listReservations(); const tbody=document.getElementById('reservationsBody'); if(!tbody) return; tbody.innerHTML=''; list.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.id}</td><td>${r.guestName}</td><td>${r.roomTitle}</td><td>${r.checkin}</td><td>${r.checkout}</td><td><button data-id="${r.id}" class="edit">Editar</button> <button data-id="${r.id}" class="del">Cancelar</button></td>`; tbody.appendChild(tr); });
    tbody.querySelectorAll('.del').forEach(b=>b.addEventListener('click',e=>{ if(!confirm('Cancelar reserva?')) return; deleteReservation(+e.target.dataset.id); renderReservations(); }));
    tbody.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',e=>{ const id=+e.target.dataset.id; const res=listReservations().find(x=>x.id==id); document.getElementById('resId').value=res.id; document.getElementById('guestSelect').value=res.guestId; document.getElementById('roomSelect').value=res.roomId; document.getElementById('checkin').value=res.checkin; document.getElementById('checkout').value=res.checkout; }));
  }

  function initReservations(){ requireAuth(); // populate selects
    const gsel=document.getElementById('guestSelect'); const rsel=document.getElementById('roomSelect'); if(gsel && rsel){ gsel.innerHTML=''; rsel.innerHTML=''; listGuests().forEach(g=> gsel.insertAdjacentHTML('beforeend',`<option value="${g.id}">${g.name}</option>`)); listRooms().forEach(r=> rsel.insertAdjacentHTML('beforeend',`<option value="${r.id}">${r.title} — R$ ${r.price}</option>`)); }
    renderReservations(); const form=document.getElementById('resForm'); if(!form) return; form.addEventListener('submit',e=>{ e.preventDefault(); const id=+form.resId.value; const guestId=+form.guestSelect.value; const roomId=+form.roomSelect.value; const guest=listGuests().find(x=>x.id==guestId); const room=listRooms().find(x=>x.id==roomId); const payload={guestId,guestName:guest.name,roomId,roomTitle:room.title,checkin:form.checkin.value,checkout:form.checkout.value}; if(id) updateReservation(id,payload); else addReservation(payload); form.reset(); renderReservations(); }); }

  // expose API
  window.app = {
    initLogin, initRegister, initDashboard, initGuests, initRooms, initReservations,
    requireAuth, currentUser, logout,
    // data helpers (for debugging)
    _db: { listGuests, listRooms, listReservations }
  };

  // auto-seed on load
  seed();
})();
