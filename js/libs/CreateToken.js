class CreateToken {
    CreateToken(
      innerRadius,
      outerRadius,
      innerDetail,
      outerDetail,
      innerColour,
      outerColour,
      innerOpacity,
      outerOpacity
    ) {
      //createToken creates a token consisting of 2 objects, one within the other.
      //Opacities may be set in order to alter the appearance as well as make the inner object visible
      const innerGeometry = new THREE.OctahedronBufferGeometry(
        innerRadius,
        innerDetail
      );
      const innerMaterial = new THREE.MeshLambertMaterial({
        color: innerColour,
        transparent: true,
        opacity: innerOpacity,
      });
      const innerCustom = new THREE.Mesh(innerGeometry, innerMaterial);
  
      const outerGeometry = new THREE.OctahedronBufferGeometry(
        outerRadius,
        outerDetail
      );
      const outerMaterial = new THREE.MeshLambertMaterial({
        color: outerColour,
        transparent: true,
        opacity: outerOpacity,
      });
      const outerCustom = new THREE.Mesh(outerGeometry, outerMaterial);
  
      outerCustom.add(innerCustom);
      console.log(outerCustom);
    }
  
    getToken() {
      return outerCustom;
    }
  }
  