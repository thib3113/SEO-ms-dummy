import amqp      from "amqplib/callback_api";
import async     from "async";
import mongoose  from "mongoose";
import {console} from "./config";

async.parallel({
                  mongo : function (callback) {

                       //mongodb://utilisateur:motdepasse@url:port
                       //attention, utilisateur et motdepasse doivent être url compliant
                       console.debug("start mongo connection");
                       mongoose.connect("mongodb://root:ynov2018@nexus2.devandstudy.com:9020")
                               .then(() => {
                                   console.debug("mongo connected");
                                   callback(null, true);
                               })
                               .catch(err => {
                                   console.debug("mongo connection failed", err);
                                   callback(err);
                               });
                   },
                   rabbit: function (callback) {
                       //connect to rabbitMQ

                       //amqp://utilisateur:motdepasse@url:port
                       //attention, utilisateur et motdepasse doivent être url compliant
                       amqp.connect("amqp://ynov:ynov2018@nexus2.devandstudy.com:9672", function (err, conn) {
                           if (err) {
                               console.debug("rabbitMQ connection failed");
                               return callback(err);
                           }
                           conn.createChannel(function (err, ch) {
                               if (!err) {
                                   console.debug("rabbitMQ connected");
                               }
                               else {
                                   console.debug("rabbitMQ connection failed");
                               }
                               callback(err, ch);
                           });
                       });
                   }
               },
               function (err, results) {
                   if (err) {
                       console.error(err);
                       process.exit(1);
                   }

                   let ch = results.rabbit;

                   //TODO changer ce nom, et me dire le nom de votre micro service, et quand vous voulez recevoir une tache
                   let q = "nomDeVotreMicroService";
                   ch.assertQueue(q, {durable: false, maxPriority: 100});

                   //ici vous indiquez le nombre de taches en même temps au max
                   ch.prefetch(10);

                   console.debug(" [*] Waiting for messages in %s. To exit kill me", q);
                   ch.consume(q, function (msg) {
                       let task;
                       try {
                           task = JSON.parse(msg.content.toString());
                       }
                       catch (e) {
                           console.error("Can't parse msg", e);
                           return;
                       }

                       //////////////////////////////////
                       //////////VOTRE CODE ICI//////////
                       //////////////////////////////////

                       //cette commande pour dire que vous avez finis votre tache en cours
                       ch.ack(msg);
                   }, {noAck: false});
               });

