--[[
  Advanced MDT — FiveM NUI Resource
  ضع هذا المجلد في resources/[police]/mdt-nui
  أضف في server.cfg: ensure mdt-nui
]]

fx_version 'cerulean'
game 'gta5'

name 'mdt-nui'
description 'Advanced Police MDT — Glassmorphism NUI'
author 'MDT Team'
version '1.0.0'

lua54 'yes'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/style.css',
    'html/js/main.js',
    'html/js/data.js',
}

client_scripts {
    'client/api_bridge.lua',
    'client/main.lua',
}

-- اختياري: ربط مع ESX / QBCore
-- shared_scripts { '@es_extended/imports.lua' }
