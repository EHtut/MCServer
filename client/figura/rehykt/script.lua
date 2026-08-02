-- Cogs and Cadavers - Rehykt's avatar
--
-- Written to run BEFORE the model exists. Drop this in now and it loads clean
-- with no model.bbmodel at all; build the model in Blockbench later and it is
-- adopted on the next reload with no edits here.
--
-- That is deliberate. The usual Figura starter script hardcodes part and
-- animation names, so it throws the moment your model's parts are named
-- anything else - and a Lua error in Figura kills the WHOLE avatar, not just
-- the broken line. Everything below is discovered at runtime instead.
--
-- Every API call here was checked against figura-0.1.6's own en_us.json
-- documentation rather than written from memory.
--
-- CONVENTIONS the script looks for (name things this way in Blockbench):
--   animations named  idle / walk / sprint / sneak   -> driven automatically
--   animations named  emote_<something>              -> appear in the action wheel
--   anything else                                    -> ignored, yours to drive

-- =========================================================================
-- model adoption
-- =========================================================================
-- models.<filename>. A .bbmodel saved as "model.bbmodel" becomes models.model.
-- Indexing a model that does not exist returns nil rather than throwing, so
-- this is safe on an empty avatar.
local customModel = models.model

-- Hide the vanilla player ONLY when there is something to replace it with -
-- otherwise the avatar would render an invisible player, which reads as
-- "Figura is broken" rather than "the model is not built yet".
--
-- vanilla_model.PLAYER is only the body parts. ARMOR and HELD_ITEMS are
-- separate groups and stay visible, so armour and weapons still show. That
-- matters here: this is an Epic Fight pack and the weapon is the point.
if customModel then
    vanilla_model.PLAYER:setVisible(false)
end

-- =========================================================================
-- animation discovery
-- =========================================================================
local anims = {}          -- name -> Animation
local emotes = {}         -- ordered list of emote names

for _, anim in ipairs(animations:getAnimations()) do
    local name = anim:getName()
    anims[name] = anim
    if name:find("^emote_") then
        table.insert(emotes, name)
    end
end
table.sort(emotes)

-- Locomotion animations loop; emotes play once and release.
for _, name in ipairs({"idle", "walk", "sprint", "sneak"}) do
    if anims[name] then
        anims[name]:setLoop("LOOP")
        anims[name]:setPriority(0)
    end
end
for _, name in ipairs(emotes) do
    -- Priority 1 so an emote visibly overrides the locomotion layer instead of
    -- fighting it for the same bones.
    --
    -- Not chained. Action:title():item() chaining is the documented Figura
    -- idiom and is safe, but nothing in the jar proves the Animation setters
    -- also return self, and a nil-index here would take the whole avatar down.
    anims[name]:setLoop("ONCE")
    anims[name]:setPriority(1)
end

-- =========================================================================
-- locomotion state machine
-- =========================================================================
-- One animation at a time, switched only on CHANGE. Calling :play() every tick
-- restarts the animation every tick, which looks like a frozen first frame -
-- a classic Figura bug that is easy to stare past.
local currentState = nil

local function desiredState()
    if not player:isOnGround() and player:isFalling() then return "idle" end
    if player:isSneaking() then return "sneak" end
    if player:isSprinting() then return "sprint" end
    if player:isMoving()    then return "walk"   end
    return "idle"
end

local function applyState(state)
    if state == currentState then return end
    if currentState and anims[currentState] then
        anims[currentState]:stop()
    end
    if anims[state] then
        anims[state]:play()
    end
    currentState = state
end

events.TICK:register(function()
    -- player is nil for the first few ticks while the entity loads.
    if not player:isLoaded() then return end
    applyState(desiredState())
end, "locomotion")

-- =========================================================================
-- emotes  (ping-synchronised)
-- =========================================================================
-- THE Figura multiplayer rule: code that runs from host input runs ONLY on the
-- host's client. Everyone else sees nothing. A ping is the one mechanism that
-- replicates, so every emote goes through one - the action wheel calls the
-- ping, and the ping is what actually plays the animation.
--
-- Get this wrong and it looks perfect in single player and does nothing on the
-- server, which is a miserable thing to debug.
function pings.playEmote(name)
    local anim = anims[name]
    if not anim then return end
    for _, other in ipairs(emotes) do
        if other ~= name and anims[other]:isPlaying() then
            anims[other]:stop()
        end
    end
    anim:play()
end

function pings.stopEmotes()
    for _, name in ipairs(emotes) do
        anims[name]:stop()
    end
end

-- =========================================================================
-- action wheel
-- =========================================================================
-- Built only for the host - nobody else opens your wheel, and building it for
-- remote copies of the avatar is wasted work every load.
if host:isHost() then
    local page = action_wheel:newPage()
    action_wheel:setPage(page)

    for _, name in ipairs(emotes) do
        local label = name:gsub("^emote_", ""):gsub("_", " ")
        page:newAction()
            :title(label:sub(1, 1):upper() .. label:sub(2))
            :item("minecraft:music_disc_cat")
            :color(0.42, 0.56, 0.23)
            :onLeftClick(function() pings.playEmote(name) end)
    end

    if #emotes > 0 then
        page:newAction()
            :title("Stop")
            :item("minecraft:barrier")
            :color(0.7, 0.2, 0.2)
            :onLeftClick(function() pings.stopEmotes() end)
    end

    -- Status readout. isAvatarUploaded is the answer to the only question that
    -- matters in multiplayer: can your brother actually see this? Loaded
    -- locally and uploaded to the backend are different states, and the avatar
    -- looks identical to YOU in both.
    page:newAction()
        :title("Avatar status")
        :item("minecraft:spyglass")
        :onLeftClick(function()
            local uploaded = host:isAvatarUploaded()
            host:setActionbar(
                (customModel and "model: yes" or "model: none (vanilla shown)")
                .. "  |  animations: " .. tostring(#emotes) .. " emote(s)"
                .. "  |  uploaded: " .. (uploaded and "YES - others can see it"
                                                   or "NO - only you can see it")
            )
        end)
end
