"use client";
import { Button } from "@nextui-org/button";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Link } from "@nextui-org/link";
import { Tabs, Tab } from "@nextui-org/tabs";

export function ContactForm() {
  return (
    <section className="section max-w-4xl pb-16 lg:pb-24">
      <Tabs
        classNames={{
          base: "flex flex-col items-start",
          tabList: "rounded-full p-1",
          cursor: "rounded-full",
        }}
      >
        <Tab key="chofer" title="Para Choferes">
          <Card className="rounded-3xl border border-default-200 p-2 shadow-none sm:p-4">
            <CardHeader className="flex gap-2">
              <p className="lg:flex gap-2">
                Si deseas ser parte de nuestro equipo de Choferes, envíanos tu
                CV al siguiente correo:{" "}
                <Link
                  isExternal
                  as="span"
                  href="mailto:reclutamiento@ricardosymas.com"
                >
                  reclutamiento@ricardosymas.com
                </Link>
              </p>
            </CardHeader>
            <CardBody className="space-y-10">
              <Input
                label="Puesto al que postula"
                labelPlacement="outside"
                placeholder="Escribe el puesto..."
              />
              <Input
                label="Lugar"
                labelPlacement="outside"
                placeholder="Escribe el lugar..."
              />
              <Input
                label="Correo"
                labelPlacement="outside"
                placeholder="Escribe tu correo"
              />
              <Input
                label="Teléfono"
                labelPlacement="outside"
                placeholder="Numero de teléfono"
              />
              <Input
                label="Observaciones"
                labelPlacement="outside"
                placeholder="Escribe aqui..."
              />
            </CardBody>
            <CardFooter className="justify-end">
              <Button color="primary" radius="full">
                Enviar
              </Button>
            </CardFooter>
          </Card>
        </Tab>
        <Tab key="pasajero" title="Para Pasajeros">
          <Card className="rounded-3xl border border-default-200 p-2 shadow-none sm:p-4">
            <CardHeader>
              Estamos gustosos de poder recibir tus requerimientos
            </CardHeader>
            <CardBody className="space-y-10">
              <Input
                label="Nombres Completos"
                labelPlacement="outside"
                placeholder="Escribe tu nombre"
              />
              <Input
                label="Número Telefónico"
                labelPlacement="outside"
                placeholder="Escribe tu numero"
              />
              <Input
                label="Correo"
                labelPlacement="outside"
                placeholder="Escribe tu correo"
              />
              <Input
                label="Requerimiento"
                labelPlacement="outside"
                placeholder="Escribe tus requerimientos..."
              />
            </CardBody>
            <CardFooter className="justify-end">
              <Button color="primary" radius="full">
                Enviar
              </Button>
            </CardFooter>
          </Card>
        </Tab>
      </Tabs>
    </section>
  );
}
