--[[
  ═══════════════════════════════════════════════════════════════
  CLIENT — ربط الواجهة (NUI) مع اللعبة
  ═══════════════════════════════════════════════════════════════

  الأوامر:
    /mdt          — فتح/إغلاق الـ MDT
    F5            — اختصار (قابل للتعديل)

  التواصل:
    Lua → NUI  :  SendNUIMessage({ action = '...', data = {...} })
    NUI → Lua  :  RegisterNUICallback('eventName', function(data, cb) ... end)

  مثال من السيرفر:
    TriggerClientEvent('mdt-nui:open', source, officerData)
]]

local MDT_OPEN = false
local RESOURCE = GetCurrentResourceName()

-- ─── فتح الواجهة ─────────────────────────────────────────────
local function OpenMDT(payload)
    if MDT_OPEN then return end
    MDT_OPEN = true

    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false)

    -- إرسال بيانات الضابط والوحدات إلى الواجهة
    SendNUIMessage({
        action = 'open',
        data = payload or BuildDefaultPayload(),
    })

    -- Discord Bot API / ESX: استبدل BuildDefaultPayload ببيانات حقيقية
end

-- ─── إغلاق الواجهة ───────────────────────────────────────────
local function CloseMDT()
    if not MDT_OPEN then return end
    MDT_OPEN = false

    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

-- ─── بيانات تجريبية (استبدلها بـ ESX/QBCore/Discord) ─────────
function BuildDefaultPayload()
  local ped = PlayerPedId()
  local coords = GetEntityCoords(ped)

  return {
    officer = {
      name       = 'James Carter',
      rank       = 'Sergeant',
      department = 'LSPD',
      callsign   = '1-L-12',
      badge      = '1247',
      onDuty     = true,
    },
    position = {
      x = coords.x,
      y = coords.y,
      z = coords.z,
    },
    job = 'police', -- police | ems | doj | fire
  }
end

-- ─── NUI Callbacks (استقبال من JavaScript) ───────────────────

--[[
  يُستدعى من main.js:
    fetch(`https://${GetParentResourceName()}/close`, { method: 'POST', body: '{}' })
]]
RegisterNUICallback('close', function(_, cb)
    CloseMDT()
    cb({ ok = true })
end)

--[[
  تبديل حالة الخدمة On/Off Duty
  NUI: postNui('toggleDuty', { onDuty: true })
]]
RegisterNUICallback('toggleDuty', function(data, cb)
    local onDuty = data.onDuty == true
  -- TriggerServerEvent('mdt:server:setDuty', onDuty)
    print(('[MDT] Duty toggled: %s'):format(onDuty and 'ON' or 'OFF'))
    cb({ ok = true, onDuty = onDuty })
end)

--[[
  بحث مواطن — أرسل النتائج من السيرفر
  NUI: postNui('searchCitizen', { query: 'Marcus', mode: 'name' })
]]
RegisterNUICallback('searchCitizen', function(data, cb)
    local query = data.query or ''
    local mode  = data.mode or 'name'

  -- TriggerServerEvent('mdt:server:searchCitizen', query, mode)
  -- أو استعلام Discord Bot API ثم:
  -- TriggerClientEvent('mdt-nui:searchResults', source, results)

    -- نتائج تجريبية للتطوير بدون سيرفر
    cb({
        ok = true,
        results = {
            {
                id = 'doss-001',
                fullName = 'Marcus Webb',
                nationalId = 'LS-928471',
                phone = '555-0201',
                flags = { 'مطلوب', 'خطير' },
                warrants = 2,
            },
        },
    })
end)

--[[
  تصدير مذكرة / تقرير إلى Discord
]]
RegisterNUICallback('exportDiscord', function(data, cb)
    local exportType = data.type or 'warrant'
  -- TriggerServerEvent('mdt:server:exportDiscord', exportType, data.payload)
    print(('[MDT] Export Discord: %s'):format(exportType))
    cb({ ok = true, sent = true })
end)

--[[
  معالجة غرامة
]]
RegisterNUICallback('processFine', function(data, cb)
  -- TriggerServerEvent('mdt:server:processFine', data)
    print(('[MDT] Fine processed: $%s'):format(data.total or 0))
    cb({ ok = true })
end)

--[[
  تعيين وحدة على بلاغ
]]
RegisterNUICallback('attachUnit', function(data, cb)
  -- TriggerServerEvent('mdt:server:attachUnit', data.incidentId, data.unitId)
    cb({ ok = true })
end)

-- ─── أحداث من السيرفر ────────────────────────────────────────

--[[
  من السيرفر:
    TriggerClientEvent('mdt-nui:open', playerId, officerData)
]]
RegisterNetEvent('mdt-nui:open', function(payload)
    OpenMDT(payload)
end)

RegisterNetEvent('mdt-nui:close', function()
    CloseMDT()
end)

--[[
  تحديث البلاغات المباشرة (WebSocket / polling من السيرفر)
    TriggerClientEvent('mdt-nui:updateIncidents', playerId, incidents)
]]
RegisterNetEvent('mdt-nui:updateIncidents', function(incidents)
    SendNUIMessage({
        action = 'updateIncidents',
        data = incidents,
    })
end)

RegisterNetEvent('mdt-nui:updateUnits', function(units)
    SendNUIMessage({
        action = 'updateUnits',
        data = units,
    })
end)

RegisterNetEvent('mdt-nui:notify', function(title, message, variant)
    SendNUIMessage({
        action = 'notify',
        data = { title = title, message = message, variant = variant or 'info' },
    })
end)

RegisterNetEvent('mdt-nui:searchResults', function(results)
    SendNUIMessage({
        action = 'searchResults',
        data = results,
    })
end)

-- ─── أوامر واختصارات ─────────────────────────────────────────

RegisterCommand('mdt', function()
    if MDT_OPEN then
        CloseMDT()
    else
        OpenMDT()
    end
end, false)

RegisterKeyMapping('mdt', 'Open Police MDT', 'keyboard', 'F5')

-- إغلاق بـ ESC يُعالج من داخل NUI → callback 'close'

-- ─── ESX مثال (أزل التعليق عند الاستخدام) ───────────────────
--[[
local ESX = exports['es_extended']:getSharedObject()

RegisterCommand('mdt', function()
    local xPlayer = ESX.GetPlayerData()
    if xPlayer.job.name ~= 'police' then return end
    OpenMDT({
        officer = {
            name = xPlayer.getName(),
            rank = xPlayer.job.grade_label,
            department = 'LSPD',
            callsign = '—',
            onDuty = true,
        },
        job = 'police',
    })
end, false)
]]
