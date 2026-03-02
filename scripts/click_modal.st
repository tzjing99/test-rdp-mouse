-- SenseTalk example scripts for clicking the modal-triggering row
-- 1) Image-based click (recommended for EPF SUT Viewer / RDP)
-- Place a reference image named "btn-view-details.png" in the same folder

-- Wait for the image to appear (10 second timeout), move there and click
if ImageFound("btn-view-details.png", 10) then
    moveto "btn-view-details.png"
    mouseButtonDown 1
    wait 0.05
    mouseButtonUp 1
    Log "Clicked View Details button via image recognition."
else
    LogError "Button image not found: btn-view-details.png"
end if

-- 2) Coordinate-based click (fallback). Adjust X/Y to match the target.
-- Uncomment and set the proper coordinates when using this approach.
-- moveto 600, 320
-- mouseButtonDown 1
-- wait 0.05
-- mouseButtonUp 1
-- Log "Clicked at coordinates (600,320)."
