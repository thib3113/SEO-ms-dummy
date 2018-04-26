import amqp                           from "amqplib/callback_api";
import async                          from "async";
import mongoose                       from "mongoose";
import {amqpUrl, console, mongodbUrl, mariaDBUrl} from "./common/config";

//si vous souhaitez ne pas utiliser mongo / rabbit ou mariadb, il vous suffit d'ajouter "return callback(null)" au début de la fonction correspondante

async.parallel({
        mongo : function (callback) {
            console.debug("start mongo connection");
            mongoose.connect(mongodbUrl)
                    .then(() => {
                        console.debug("mongo connected");
                        callback(null, true);
                    })
                    .catch(err => {
                        console.error("mongo connection failed", err);
                        callback(err);
                    });
        },
        rabbit: function (callback) {
            //connect to rabbitMQ
            console.debug("start rabbitMQ connection");
            amqp.connect(amqpUrl, function (err, conn) {
                if (err) {
                    console.error("rabbitMQ connection failed");
                    return callback(err);
                }
                conn.createChannel(function (err, ch) {
                    if (!err) {
                        console.debug("rabbitMQ connected");
                    }
                    else {
                        console.error("rabbitMQ connection failed");
                    }
                    callback(err, ch);
                });
            });
        },
        maria : function (callback) {
            console.debug("start MariaDB connection : "+mariaDBUrl);
            console.error("MariaDB connection failed : not yet implemented");
            callback(null);
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

            //cette commande pour dire que vous avez finis votre tache en cours (comme une callback)
            ch.ack(msg);
        }, {noAck: false});
    });

