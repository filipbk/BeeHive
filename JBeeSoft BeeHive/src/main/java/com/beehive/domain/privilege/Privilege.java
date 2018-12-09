package com.beehive.domain.privilege;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.validation.constraints.NotBlank;

import org.hibernate.annotations.NaturalId;

@Entity
public class Privilege {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
	
	@NotBlank
	@NaturalId
	private String name;
	
	@NotBlank
	private String description;

}
