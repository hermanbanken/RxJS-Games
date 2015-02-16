// Physics inspiration: http://www.ibm.com/developerworks/library/wa-build2dphysicsengine/

class CollisionDetector {
    static collideRect(collider: Rectangle, collidee: Rectangle):Boolean {
        var l1 = collider.getLeft();
        var t1 = collider.getTop();
        var r1 = collider.getRight();
        var b1 = collider.getBottom();

        var l2 = collidee.getLeft();
        var t2 = collidee.getTop();
        var r2 = collidee.getRight();
        var b2 = collidee.getBottom();

        // If the any of the edges are beyond any of the
        // others, then we know that the box cannot be
        // colliding
        return !(b1 < t2 || t1 > b2 || r1 < l2 || l1 > r2);
    }
}