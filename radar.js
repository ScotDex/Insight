const METERS_IN_LY = 9_460_528_400_000_000;

function calculateLY(sys1,sys2) {
    const dx = sys1.x - sys2.x;
    const dy = sys1.y - sys2.y;
    const dz = sys1.z - sys2.z;

    const distanceMeters = Math.sqrt(dx*dx + dy*dy + dz*dz);
    return distanceMeters / METERS_IN_LY;
}

