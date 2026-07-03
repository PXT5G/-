--[[
  HTTP Bridge — يربط FiveM NUI مع discord-bot API
  بدون تعارض مع NUI callbacks المباشرة

  في server.cfg:
    set mdt_api_url "http://127.0.0.1:3921"
    set mdt_api_secret "نفس API_SECRET في discord-bot/.env"
]]

local API_URL = GetConvar('mdt_api_url', '')
local API_SECRET = GetConvar('mdt_api_secret', '')

local function ApiEnabled()
    return API_URL ~= '' and API_SECRET ~= ''
end

--- طلب HTTP إلى Discord Bot API
---@param method string
---@param path string
---@param body table|nil
---@param cb fun(ok: boolean, data: table|nil)
function MdtApiRequest(method, path, body, cb)
    if not ApiEnabled() then
        cb(false, nil)
        return
    end

    local url = API_URL:gsub('/$', '') .. path
    local payload = body and json.encode(body) or ''

    PerformHttpRequest(url, function(status, response)
        if status >= 200 and status < 300 then
            local ok, data = pcall(json.decode, response or '{}')
            cb(true, ok and data or {})
        else
            cb(false, nil)
        end
    end, method, payload, {
        ['Content-Type'] = 'application/json',
        ['Authorization'] = 'Bearer ' .. API_SECRET,
    })
end
