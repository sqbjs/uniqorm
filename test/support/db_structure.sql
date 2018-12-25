DROP SCHEMA IF EXISTS uniqorm_2 CASCADE;
DROP SCHEMA IF EXISTS uniqorm_1 CASCADE;
CREATE SCHEMA uniqorm_1 AUTHORIZATION postgres;
CREATE SCHEMA uniqorm_2 AUTHORIZATION postgres;


CREATE TABLE uniqorm_1.members
(
    id SERIAL NOT NULL,
    name character varying (20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT members_pkey PRIMARY KEY (id)
);

CREATE TABLE uniqorm_1.countries
(
    id character varying (5) COLLATE pg_catalog."default" NOT NULL,
    name character varying (20) COLLATE pg_catalog."default" NOT NULL,
    phone_code smallint,
    CONSTRAINT countries_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE uniqorm_1.countries IS 'countries table';
COMMENT ON COLUMN uniqorm_1.countries.phone_code IS 'Universal phone code number';

CREATE TABLE uniqorm_1.cities
(
    id integer NOT NULL,
    country_id character varying (5) NOT NULL,
    name character varying (20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT cities_pkey PRIMARY KEY (id),
    CONSTRAINT fk_cities_country FOREIGN KEY (country_id)
        REFERENCES uniqorm_1.countries (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE uniqorm_1.streets
(
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying (64) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT streets_pkey PRIMARY KEY (id),
    CONSTRAINT fk_streets_city FOREIGN KEY (city_id)
        REFERENCES uniqorm_1.cities (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE uniqorm_2.customers
(
    id SERIAL NOT NULL,
    member_id integer NOT NULL,
    name character varying(64) COLLATE pg_catalog."default" NOT NULL,
    street_id integer NOT NULL,
    balance numeric(12,4),
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT fk_customers_street FOREIGN KEY (street_id)
        REFERENCES uniqorm_1.streets (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_customers_member FOREIGN KEY (member_id)
        REFERENCES uniqorm_1.members (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE UNIQUE INDEX ux_customers_id on uniqorm_2.customers(id, member_id);


CREATE TABLE uniqorm_1.tags
(
    id SERIAL NOT NULL,
    name character varying (20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT tags_pkey PRIMARY KEY (id)
);

CREATE TABLE uniqorm_2.customer_tags
(
    customer_id integer NOT NULL,
    tag_id integer NOT NULL,
    active smallint NOT NULL default 1,
    CONSTRAINT customer_tags_pkey PRIMARY KEY (customer_id, tag_id),
    CONSTRAINT fk_customer_tags_customer FOREIGN KEY (customer_id)
        REFERENCES uniqorm_2.customers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_customer_tags_tag FOREIGN KEY (tag_id)
        REFERENCES uniqorm_1.tags (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE uniqorm_2.notes
(
    id SERIAL NOT NULL,
    source character varying (20) COLLATE pg_catalog."default" NOT NULL,
    source_key integer NOT NULL,
    contents character varying (128) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT notes_pkey PRIMARY KEY (id)
);
