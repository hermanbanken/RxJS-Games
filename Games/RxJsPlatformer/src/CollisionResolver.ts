// Physics inspiration: http://www.ibm.com/developerworks/library/wa-build2dphysicsengine/

var STICKY_THRESHOLD = .0004;

class CollisionResolver {
    static resolveDisplace(player:Player, entity:Rectangle) : Player{
        var pMidX = player.getMidX();
        var pMidY = player.getMidY();
        var aMidX = entity.getMidX();
        var aMidY = entity.getMidY();

        var dx = (aMidX - pMidX) / (entity.width * .5);
        var dy = (aMidY - pMidY) / (entity.height * .5);

        var absDX = Math.abs(dx);
        var absDY = Math.abs(dy);

        // Sideways movement
        if (absDX > absDY) {
            if (dx < 0) {
                // If player comes from right
                player = player.withX(entity.getRight());
            } else {
                // If the player is approaching from left
                player = player.withX(entity.getLeft() - player.width);
            }

            // Velocity component
            player = player.withVX(-player.vx * entity.restitution);

            if (Math.abs(player.vx) < STICKY_THRESHOLD) {
                player = player.withVX(0);
            }

        // If this collision is coming from the top or bottom more
        } else {
            if (dy < 0) {
                // If the player is approaching from positive Y
                player = player.withY(entity.getBottom());

            } else {
                // If the player is approaching from negative Y
                player = player.withY(entity.getTop() - player.height);
            }

            //Velocity component
            player = player.withVY(-player.vy * entity.restitution);
            if (Math.abs(player.vy) < STICKY_THRESHOLD) {
                player = player.withVY(0);
            }
        }

        return player
    }
}