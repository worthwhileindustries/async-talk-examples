<?php
namespace ExDraw;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Server implements MessageComponentInterface
{
    const USER_LIST = 0;
    const USER_ID = 1;
    const USER_CONNECTED = 2;
    const USER_DISCONNECTED = 3;

    protected $clients;
    protected $id = 0;
    protected $nicks = array();
    protected $drawing = array();
    protected $drawState = array();

    /**
     * Initialize $clients to SplObjectStorage.  This will be used to
     * store all connections.
     */
    public function __construct()
    {
        $this->clients = new \SplObjectStorage();
    }

    /**
     * Handle the new connection when it's received.
     *
     * @param  ConnectionInterface $conn
     * @return void
     */
    public function onOpen(ConnectionInterface $conn)
    {
        $this->id++;

        echo "Connecting {$this->id}" . PHP_EOL;

        $this->clients->attach($conn, $this->id);
        $this->nicks[$this->id] = "Guest {$this->id}";

        // send user id
        $conn->send("{$this->id},". self::USER_ID .",". $this->nicks[$this->id]);

        // broadcast all existing users.
        $userList = [];
        foreach($this->nicks as $id => $nick) {
            if($id != $this->id) {
                $userList[] = "{$id},{$nick}";
            }
        }
        $conn->send("{$this->id},". self::USER_LIST .",". join(",", $userList));

        // send current canvas state
        $conn->send("{$this->id},4,2,1");
        foreach($this->drawState as $state) {
            $conn->send("{$this->id},". $state);
        }
        //$conn->send("{$this->id},4,1,". join(",", $this->drawState));
        $conn->send("{$this->id},4,2,0");

        // broadcast new user
        $this->onMessage($conn, self::USER_CONNECTED . ",{$this->id},{$this->nicks[$this->id]}");
    }

    /**
     * A new message was received from a connection.  Dispatch
     * that message to all other connected clients.
     *
     * @param  ConnectionInterface $from
     * @param  String              $msg
     * @return void
     */
    public function onMessage(ConnectionInterface $from, $msg)
    {
        $id = $this->clients[$from];

        // check for nickname changes
        $data = explode(",", $msg);
        if($data[0] == 4 && $data[1] == 0) {
            echo "storing nick {$data[2]}" .PHP_EOL;
            $this->nicks[$id] = $data[2];
        } elseif($data[0] == 4 && $data[1] == 2) {
            // drawing on connection started
            $this->drawing[$id] = $data[2] == 1;
            //if($data[2] == 1) {
            //    $this->drawState[] = "4,1,". join(",", array_slice($data, 3));
            //}
        } else if($this->drawing[$id]) {
            $this->drawState[] = join(",", $data);
        }

        foreach($this->clients as $client) {
           if($from !== $client) {
                $client->send($id .",". $msg);
            }
        }
    }

    /**
     * The connection has closed, remove it from the clients list.
     * @param  ConnectionInterface $conn
     * @return void
     */
    public function onClose(ConnectionInterface $conn)
    {
        $id = $this->clients[$conn];

        $this->onMessage($conn, self::USER_DISCONNECTED .",". $id .",". $this->nicks[$id]);
        unset($this->nicks[$id]);
        $this->clients->detach($conn);
        echo "closing connection for $id" . PHP_EOL;
    }

    /**
     * An error on the connection has occured, this is likely due to the connection
     * going away.  Close the connection.
     * @param  ConnectionInterface $conn
     * @param  Exception           $e
     * @return void
     */
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        $conn->close();
    }
}

