import amqp               from "amqplib/callback_api";
import async              from "async";
import mongoose           from "mongoose";

async.parallel({
                   mongo : function (callback) {

                       //mongodb://utilisateur:motdepasse@url:port
                       //attention, utilisateur et motdepasse doivent être url compliant

                       mongoose.connect("mongodb://root:ynov2018@nexus2.devandstudy.com:9020")
                               .then(() => {
                                   callback(null, true);
                               })
                               .catch(err => {
                                   callback(err);
                               });

                   },
                   rabbit: function (callback) {
                       //connect to rabbitMQ

                       //amqp://utilisateur:motdepasse@url:port
                       //attention, utilisateur et motdepasse doivent être url compliant

                       // amqp://rabbit:9672
                       amqp.connect("amqp://ynov:ynov2018@nexus2.devandstudy.com:9672", function (err, conn) {
                           if (err) return callback(err);
                           conn.createChannel(function (err, ch) {
                               callback(err, ch);
                           });
                       });
                   }
               },
               function (err, results) {
                   if (err){
                       console.error(err);
                       process.exit(1);
                   }

                   let ch = results.rabbit;

                   //TODO change this
                   let q = "nomDeVotreMicroService";
                   ch.assertQueue(q, {durable: false});

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

